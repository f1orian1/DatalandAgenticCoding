import { ensureLoggedIn } from '@e2e/utils/Auth.ts';
import { describeIf } from '@e2e/support/TestUtility';

const frameworkOneId = 'alpha-framework';
const frameworkTwoId = 'beta-framework';

const frameworkReferences = [
  {
    framework: { id: frameworkOneId },
    name: 'Alpha Framework',
    businessDefinition: 'Used to validate baseline compliance',
    schema: '{}',
  },
  {
    framework: { id: frameworkTwoId },
    name: 'Beta Framework',
    businessDefinition: 'Used to validate advanced compliance',
    schema: '{}',
  },
];

const frameworkDetailsById: Record<string, object> = {
  [frameworkOneId]: {
    framework: { id: frameworkOneId },
    name: 'Alpha Framework',
    businessDefinition: 'Used to validate baseline compliance',
    referencedReportJsonPath: 'reports/alpha',
    schema: JSON.stringify({
      governance: {
        boardOversight: 'boardOversightDataPoint',
      },
    }),
  },
  [frameworkTwoId]: {
    framework: { id: frameworkTwoId },
    name: 'Beta Framework',
    businessDefinition: 'Used to validate advanced compliance',
    referencedReportJsonPath: 'reports/beta',
    schema: JSON.stringify({
      emissions: {
        scopeOne: 'scopeOneEmissions',
      },
    }),
  },
};

describeIf(
  'Documentation page framework search and selection',
  {
    executionEnvironments: ['developmentLocal', 'ci', 'developmentCd'],
  },
  () => {
    beforeEach(() => {
      ensureLoggedIn();

      cy.intercept('GET', '**/specifications/frameworks*', {
        statusCode: 200,
        body: frameworkReferences,
      }).as('listFrameworks');

      cy.intercept('GET', '**/specifications/frameworks/*', (request) => {
        const frameworkRequestMatch = request.url.match(/\/specifications\/frameworks\/([^/?#]+)/);
        const requestedFrameworkId = frameworkRequestMatch?.[1] ?? '';
        const responseBody = frameworkDetailsById[requestedFrameworkId];
        request.reply({
          statusCode: responseBody ? 200 : 404,
          body: responseBody,
        });
      }).as('getFrameworkSpecification');
    });

    it('shows framework cards, supports metadata and hierarchy search, and deep-links selected framework', () => {
      cy.visitAndCheckAppMount('/documentation');
      cy.url().should('include', '/documentation');
      cy.wait('@listFrameworks', { timeout: Cypress.env('short_timeout_in_ms') as number });
      cy.wait('@getFrameworkSpecification', { timeout: Cypress.env('short_timeout_in_ms') as number });

      cy.contains('h1', 'Documentation').should('exist');
      cy.get('.documentation-framework-preview').should('have.length', 2);
      cy.contains('.documentation-framework-preview', 'Alpha Framework').click();
      cy.url().should('include', `/documentation?framework=${frameworkOneId}`);
      cy.contains('.documentation-detail-card', 'Alpha Framework').should('exist');

      cy.get('.documentation-search-input').clear().type('advanced');
      cy.get('.documentation-framework-preview').should('have.length', 1);
      cy.contains('.documentation-framework-preview', 'Beta Framework').should('exist');

      cy.contains('button', 'Within All Frameworks').click();
      cy.get('.documentation-search-input').clear().type('scope one');
      cy.get('.documentation-framework-preview').should('have.length', 1);
      cy.contains('.documentation-framework-preview', 'Beta Framework').should('exist');
    });
  }
);
