<template>
  <li v-if="isVisible" class="framework-hierarchy-node">
    <div class="framework-hierarchy-entry">
      <button
        v-if="node.children.length > 0"
        type="button"
        class="framework-hierarchy-toggle"
        :aria-expanded="isEffectivelyExpanded"
        @click="isExpanded = !isExpanded"
      >
        <i
          class="pi framework-hierarchy-toggle-icon"
          :class="isEffectivelyExpanded ? 'pi-chevron-down' : 'pi-chevron-right'"
          aria-hidden="true"
        />
        <span class="framework-hierarchy-label" :class="{ 'framework-hierarchy-match': isDirectMatch }">
          {{ humanizeStringOrNumber(node.label) }}
        </span>
      </button>

      <span v-else class="framework-hierarchy-label" :class="{ 'framework-hierarchy-match': isDirectMatch }">
        {{ humanizeStringOrNumber(node.label) }}
      </span>

      <span
        v-if="node.dataPointTypeId"
        class="framework-hierarchy-data-point-type"
        :class="{ 'framework-hierarchy-match': isDataPointMatch }"
      >
        {{ humanizeStringOrNumber(node.dataPointTypeId) }}
      </span>
    </div>

    <ul v-if="node.children.length > 0 && isEffectivelyExpanded" class="framework-hierarchy-children">
      <FrameworkHierarchyNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :search-term="searchTerm"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { humanizeStringOrNumber } from '@/utils/StringFormatter';
import { computed, ref } from 'vue';

interface FrameworkHierarchyNodeModel {
  id: string;
  label: string;
  dataPointTypeId?: string;
  children: Array<FrameworkHierarchyNodeModel>;
}

const props = defineProps<{
  node: FrameworkHierarchyNodeModel;
  searchTerm?: string;
}>();

const isExpanded = ref(false);

const activeTerm = computed(() => props.searchTerm?.trim().toLowerCase() ?? '');

const isDirectMatch = computed(() => {
  if (!activeTerm.value) return false;
  return humanizeStringOrNumber(props.node.label).toLowerCase().includes(activeTerm.value);
});

const isDataPointMatch = computed(() => {
  if (!activeTerm.value || !props.node.dataPointTypeId) return false;
  return humanizeStringOrNumber(props.node.dataPointTypeId).toLowerCase().includes(activeTerm.value);
});

function nodeOrDescendantMatches(node: FrameworkHierarchyNodeModel, term: string): boolean {
  if (humanizeStringOrNumber(node.label).toLowerCase().includes(term)) return true;
  if (node.dataPointTypeId && humanizeStringOrNumber(node.dataPointTypeId).toLowerCase().includes(term)) return true;
  return node.children.some((child) => nodeOrDescendantMatches(child, term));
}

const hasMatchingDescendant = computed(() => {
  if (!activeTerm.value) return false;
  return props.node.children.some((child) => nodeOrDescendantMatches(child, activeTerm.value));
});

const isVisible = computed(() => {
  if (!activeTerm.value) return true;
  return isDirectMatch.value || isDataPointMatch.value || hasMatchingDescendant.value;
});

const isEffectivelyExpanded = computed(() => {
  if (activeTerm.value && hasMatchingDescendant.value) return true;
  return isExpanded.value;
});
</script>

<style>
.framework-hierarchy-node {
  list-style: none;
}

.framework-hierarchy-entry {
  display: grid;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
}

.framework-hierarchy-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
}

.framework-hierarchy-toggle-icon {
  width: 1rem;
}

.framework-hierarchy-label {
  font-weight: 600;
}

.framework-hierarchy-match {
  color: var(--p-primary-color);
  font-weight: 700;
}

.framework-hierarchy-data-point-type {
  color: var(--p-text-muted-color);
  font-size: var(--font-size-sm);
}

.framework-hierarchy-children {
  margin: 0;
  padding-left: var(--spacing-md);
  border-left: 1px solid var(--p-content-border-color);
}
</style>