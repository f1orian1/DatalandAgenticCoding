<template>
  <main role="main" class="documentation-page">
    <div class="documentation-content">
      <h1>Documentation</h1>

      <div v-if="isLoading" class="documentation-loading-state">
        <DatalandProgressSpinner font-size="2rem" />
      </div>

      <div v-else-if="frameworks.length > 0" class="documentation-section">
        <div class="documentation-toolbar">
          <div>
            <h2>Framework Specifications</h2>
            <p class="documentation-subtitle">
              Select a framework card to explore its description and hierarchy.
            </p>
          </div>

          <div class="documentation-toolbar-actions">
            <div class="documentation-search-bar">
              <i class="pi pi-search documentation-search-icon" aria-hidden="true" />
              <InputText
                v-model="searchQuery"
                :placeholder="searchPlaceholder"
                class="documentation-search-input"
              />
              <Button
                v-if="searchQuery"
                icon="pi pi-times"
                text
                rounded
                aria-label="Clear search"
                @click="searchQuery = ''"
              />
            </div>

            <SelectButton
              v-model="searchMode"
              :options="searchModeOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
          </div>
        </div>

        <div class="documentation-framework-grid">
          <div
            v-for="framework in filteredFrameworks"
            :key="framework.framework.id"
            class="documentation-framework-preview"
            :class="{ 'documentation-framework-preview-selected': framework.framework.id === selectedFramework?.framework.id }"
            role="button"
            tabindex="0"
            @click="selectFramework(framework.framework.id)"
            @keydown.enter="selectFramework(framework.framework.id)"
            @keydown.space.prevent="selectFramework(framework.framework.id)"
          >
            <Card class="documentation-framework-card">
              <template #title>{{ framework.name }}</template>
              <template #content>
                <p class="documentation-framework-description">
                  {{ framework.businessDefinition || 'No framework description available yet.' }}
                </p>
                <p class="documentation-framework-meta">Framework ID: {{ framework.framework.id }}</p>
              </template>
            </Card>
          </div>
        </div>

        <div v-if="searchQuery && filteredFrameworks.length === 0" class="documentation-no-results">
          <i class="pi pi-search documentation-no-results-icon" aria-hidden="true" />
          <p>No frameworks match "{{ searchQuery }}".</p>
        </div>

        <div v-if="searchMode === 'withinFramework' && !selectedFramework" class="documentation-within-hint">
          <i class="pi pi-info-circle" aria-hidden="true" />
          Select a framework card above to search within it.
        </div>

        <Card v-if="selectedFramework" class="documentation-detail-card">
          <template #title>{{ selectedFramework.name }}</template>
          <template #content>
            <p class="documentation-detail-description">
              {{ selectedFramework.businessDefinition || 'No framework description available yet.' }}
            </p>
            <p class="documentation-framework-meta">Framework ID: {{ selectedFramework.framework.id }}</p>
            <p v-if="selectedFramework.referencedReportJsonPath" class="documentation-framework-meta">
              Referenced report path: {{ selectedFramework.referencedReportJsonPath }}
            </p>

            <div class="documentation-hierarchy-section">
              <h3>Framework hierarchy</h3>
              <ul class="documentation-hierarchy-root">
                <FrameworkHierarchyNode
                  v-for="node in selectedFrameworkHierarchy"
                  :key="node.id"
                  :node="node"
                  :search-term="hierarchySearchTerm"
                />
              </ul>
            </div>
          </template>
        </Card>
      </div>

      <div v-else class="documentation-empty-state">
        <p>No framework specifications are currently available.</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import FrameworkHierarchyNode from '@/components/resources/documentation/FrameworkHierarchyNode.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { ApiClientProvider } from '@/services/ApiClients';
import { humanizeStringOrNumber } from '@/utils/StringFormatter';
import { assertDefined } from '@/utils/TypeScriptUtils';
import type { FrameworkSpecification } from '@clients/specificationservice';
import type Keycloak from 'keycloak-js';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface FrameworkHierarchyNodeModel {
  id: string;
  label: string;
  dataPointTypeId?: string;
  children: Array<FrameworkHierarchyNodeModel>;
}

type FrameworkSchema = Record<string, FrameworkSchema | string>;

const frameworks = ref<Array<FrameworkSpecification>>([]);
const isLoading = ref<boolean>(true);
const selectedFrameworkId = ref<string | undefined>(undefined);

type SearchMode = 'frameworks' | 'withinFramework' | 'withinAllFrameworks';
const searchQuery = ref('');
const searchMode = ref<SearchMode>('frameworks');
const searchModeOptions: Array<{ label: string; value: SearchMode }> = [
  { label: 'Frameworks', value: 'frameworks' },
  { label: 'Within Framework', value: 'withinFramework' },
  { label: 'Within All Frameworks', value: 'withinAllFrameworks' },
];

const getKeycloakPromise = inject<() => Promise<Keycloak>>('getKeycloakPromise');
const apiClientProvider = new ApiClientProvider(assertDefined(getKeycloakPromise)());
const route = useRoute();
const router = useRouter();

const selectedFramework = computed<FrameworkSpecification | undefined>(() => {
  return frameworks.value.find((framework) => framework.framework.id === selectedFrameworkId.value);
});

const filteredFrameworks = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();

  if (!term) {
    return frameworks.value;
  }

  if (searchMode.value === 'withinFramework') {
    return frameworks.value;
  }

  return frameworks.value.filter((framework) => {
    const matchesFrameworkMetadata =
      framework.name.toLowerCase().includes(term) ||
      (framework.businessDefinition?.toLowerCase().includes(term) ?? false);

    if (searchMode.value === 'frameworks') {
      return matchesFrameworkMetadata;
    }

    return matchesFrameworkMetadata || schemaMatchesSearch(framework.schema, term);
  });
});

const hierarchySearchTerm = computed(() => (searchMode.value === 'frameworks' ? '' : searchQuery.value));

const searchPlaceholder = computed(() => {
  switch (searchMode.value) {
    case 'frameworks':
      return 'Search frameworks by name or description...';
    case 'withinFramework':
      return 'Search within the selected framework...';
    case 'withinAllFrameworks':
      return 'Search across all frameworks and their hierarchy...';
  }
});

const selectedFrameworkHierarchy = computed<Array<FrameworkHierarchyNodeModel>>(() => {
  if (!selectedFramework.value) {
    return [];
  }

  try {
    const parsedSchema = JSON.parse(selectedFramework.value.schema) as FrameworkSchema;
    return buildHierarchyNodes(parsedSchema);
  } catch (error) {
    console.error(error);
    return [];
  }
});

onMounted(async () => {
  try {
    const frameworkReferences = (await apiClientProvider.apiClients.specificationController.listFrameworkSpecifications()).data;
    frameworks.value = await Promise.all(
      frameworkReferences.map(async (frameworkReference) => {
        return (await apiClientProvider.apiClients.specificationController.getFrameworkSpecification(
          frameworkReference.framework.id
        )).data;
      })
    );
    frameworks.value.sort((left, right) => left.name.localeCompare(right.name));
    syncSelectedFrameworkWithRoute();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});

watch(
  () => route.query.framework,
  () => {
    syncSelectedFrameworkWithRoute();
  }
);

watch(selectedFrameworkId, () => {
  if (searchMode.value === 'withinFramework') {
    searchQuery.value = '';
  }
});

function syncSelectedFrameworkWithRoute(): void {
  const frameworkIdFromRoute = typeof route.query.framework === 'string' ? route.query.framework : undefined;
  const selectedFrameworkExists = frameworks.value.some((framework) => framework.framework.id === frameworkIdFromRoute);
  selectedFrameworkId.value = selectedFrameworkExists ? frameworkIdFromRoute : frameworks.value[0]?.framework.id;
}

function selectFramework(frameworkId: string): void {
  selectedFrameworkId.value = frameworkId;
  router.replace({
    query: {
      ...route.query,
      framework: frameworkId,
    },
  }).catch((error) => console.error(error));
}

function buildHierarchyNodes(schema: FrameworkSchema, parentPath = ''): Array<FrameworkHierarchyNodeModel> {
  return Object.entries(schema).map(([key, value]) => {
    const nodePath = parentPath === '' ? key : `${parentPath}.${key}`;
    if (typeof value === 'string') {
      return {
        id: nodePath,
        label: humanizeStringOrNumber(key),
        dataPointTypeId: value,
        children: [],
      };
    }

    return {
      id: nodePath,
      label: humanizeStringOrNumber(key),
      children: buildHierarchyNodes(value, nodePath),
    };
  });
}

function schemaMatchesSearch(schema: FrameworkSchema, term: string): boolean {
  return Object.entries(schema).some(([key, value]) => {
    const keyLabel = humanizeStringOrNumber(key).toLowerCase();
    if (keyLabel.includes(term)) {
      return true;
    }

    if (typeof value === 'string') {
      return humanizeStringOrNumber(value).toLowerCase().includes(term);
    }

    return schemaMatchesSearch(value, term);
  });
}
</script>

<style>
.documentation-page {
  margin-top: 132px;
  padding: var(--spacing-lg);
}

@media only screen and (max-width: 768px) {
  .documentation-page {
    margin-top: 80px;
  }
}

.documentation-content {
  margin: 0 auto;
  max-width: 1200px;
}

.documentation-loading-state {
  margin-top: var(--spacing-lg);
  text-align: center;
}

.documentation-section {
  margin-top: var(--spacing-lg);
}

.documentation-toolbar {
  position: sticky;
  top: 4rem;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-md);
  background: var(--default-neutral-white);
}

.documentation-toolbar-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-left: auto;
}

.documentation-subtitle {
  margin: 0;
}

.documentation-framework-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.documentation-framework-preview {
  cursor: pointer;
}

.documentation-framework-preview-selected .documentation-framework-card {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}

.documentation-framework-card {
  height: 100%;
}

.documentation-framework-description {
  margin: 0 0 var(--spacing-sm);
}

.documentation-framework-meta {
  margin: 0 0 var(--spacing-xs);
  color: var(--p-text-muted-color);
  font-size: var(--font-size-sm);
}

.documentation-detail-card {
  margin-top: var(--spacing-lg);
}

.documentation-detail-description {
  margin: 0 0 var(--spacing-md);
}

.documentation-hierarchy-section {
  margin-top: var(--spacing-lg);
}

.documentation-hierarchy-root {
  margin: var(--spacing-sm) 0 0;
  padding: 0;
}

.documentation-empty-state {
  margin-top: var(--spacing-lg);
}

.documentation-search-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 240px;
  border: 1px solid var(--p-inputtext-border-color);
  border-radius: var(--p-inputtext-border-radius);
  padding: 0 var(--spacing-xs);
  background: var(--p-inputtext-background);
}

.documentation-search-icon {
  color: var(--p-text-muted-color);
  flex-shrink: 0;
}

.documentation-search-input {
  flex: 1;
  border: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  padding-left: 0;
}

.documentation-no-results {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--p-text-muted-color);
}

.documentation-no-results-icon {
  font-size: 1.25rem;
}

.documentation-within-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-sm);
  color: var(--p-text-muted-color);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
}
</style>