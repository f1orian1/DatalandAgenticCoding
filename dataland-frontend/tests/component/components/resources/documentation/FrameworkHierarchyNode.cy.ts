import FrameworkHierarchyNode from '@/components/resources/documentation/FrameworkHierarchyNode.vue';

describe('Component tests for FrameworkHierarchyNode', () => {
  const nodeWithChildren = {
    id: 'root',
    label: 'Root Category',
    children: [
      {
        id: 'root.child',
        label: 'Target Metric',
        dataPointTypeId: 'targetMetricDataPoint',
        children: [],
      },
    ],
  };

  it('expands and collapses child nodes when the toggle is clicked', () => {
    // @ts-ignore
    cy.mountWithPlugins(FrameworkHierarchyNode, {
      props: {
        node: nodeWithChildren,
      },
    });

    cy.contains('.framework-hierarchy-label', 'Root Category').should('exist');
    cy.contains('.framework-hierarchy-label', 'Target Metric').should('not.exist');

    cy.get('.framework-hierarchy-toggle').click();
    cy.contains('.framework-hierarchy-label', 'Target Metric').should('exist');

    cy.get('.framework-hierarchy-toggle').click();
    cy.contains('.framework-hierarchy-label', 'Target Metric').should('not.exist');
  });

  it('auto-expands and highlights matching descendants for active search terms', () => {
    // @ts-ignore
    cy.mountWithPlugins(FrameworkHierarchyNode, {
      props: {
        node: nodeWithChildren,
        searchTerm: 'target',
      },
    });

    cy.contains('.framework-hierarchy-label', 'Target Metric').should('exist');
    cy.contains('.framework-hierarchy-match', 'Target Metric').should('exist');
  });

  it('hides non-matching branches when search is active', () => {
    // @ts-ignore
    cy.mountWithPlugins(FrameworkHierarchyNode, {
      props: {
        node: nodeWithChildren,
        searchTerm: 'not-present',
      },
    });

    cy.get('.framework-hierarchy-node').should('not.exist');
  });
});
