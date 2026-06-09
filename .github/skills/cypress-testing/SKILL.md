---
name: cypress-testing
description: 'Create and maintain Cypress E2E and Component Tests for the Dataland frontend. Use when the user asks for Cypress tests, test setup, flaky test fixes, or coverage for Vue UI flows such as documentation browsing and search.'
license: MIT
allowed-tools: Bash
---

# Cypress Testing for Dataland Frontend

## Overview

Use this skill when implementing or improving Cypress tests in the frontend.

This repository uses Vue 3 and Vite. Cypress should be used in two modes:

- E2E tests for full user journeys through the running app
- Component tests for isolated Vue components and interaction logic

## When to Use This Skill

Use this skill when the user asks to:

- add Cypress E2E tests
- add Cypress Component Tests
- cover a new feature with tests
- fix flaky Cypress tests
- improve frontend test confidence before merge

Do not use this skill for backend integration tests that do not involve browser UI behavior.

## Core Testing Strategy

1. Prefer user-facing assertions
- Assert visible text, role, label, and behavior instead of implementation details.

2. Keep tests deterministic
- Stub API responses in tests when possible.
- Avoid reliance on unstable external state.

3. Use resilient selectors
- Prefer data-testid selectors for interactive controls and key UI regions.
- Avoid long CSS chains and brittle nth-child selectors.

4. Keep E2E flows short
- One intent per test.
- Use separate tests for navigation, search mode behavior, and deep linking.

5. Cover critical logic at component level
- Search filtering and hierarchy expansion belong in component tests.

## Recommended Test Targets for Current Documentation Feature

### E2E coverage

- route navigation to /documentation
- framework cards rendered from API data
- selecting a framework shows detail panel
- search modes switch correctly:
  - Frameworks
  - Within Framework
  - Within All Frameworks
- query parameter deep link selects framework: ?framework=<id>
- link from upload page to documentation page works

### Component coverage

- DocumentationPage.vue
  - mode-specific search filtering
  - framework selection updates query state
  - empty/loading/error states
- FrameworkHierarchyNode.vue
  - expand/collapse behavior
  - match highlighting
  - auto-expansion when descendant matches search
  - visibility behavior under active search

## Execution Workflow

1. Discover current Cypress setup
- Check package scripts and Cypress config files.
- Check existing cypress/e2e and cypress/component structure.

2. Add or improve stable selectors
- Add data-testid only where needed for test stability.

3. Write tests
- E2E first for happy path.
- Component tests for logic-heavy behavior.

4. Run tests locally
- Run only impacted specs first.
- Then run the full relevant suite if feasible.

5. Report outcomes
- Provide pass/fail summary.
- If failing, include root cause and proposed fix.

## Command Reference

Run these from dataland-frontend after verifying script names in package.json:

- npm run test:e2e
- npm run test:e2e -- --spec <path-to-spec>
- npm run test:component
- npm run test:component -- --spec <path-to-spec>
- npx cypress open
- npx cypress run --e2e
- npx cypress run --component

If script names differ, use the repository-defined scripts and do not invent new command names.

## Authoring Guidelines

- Keep test names behavior-oriented.
- Use beforeEach only for shared setup that genuinely applies to every test in the block.
- Avoid cy.wait(<ms>) fixed sleeps.
- Prefer waiting on app state:
  - cy.contains(...)
  - cy.get(...).should(...)
  - cy.intercept(...).as(...); cy.wait('@alias')
- Avoid over-mocking in E2E.
- Keep component tests isolated and fast.

## Definition of Done

A Cypress task is complete when:

- tests clearly validate the requested behavior
- selectors are stable and readable
- tests pass locally for the changed scope
- no obvious flakiness patterns are introduced
- user receives a short summary of what is covered and what is intentionally not covered

## Safety Rules

- Do not modify unrelated tests while adding new coverage unless required for compilation.
- Do not weaken assertions just to make tests pass.
- Do not disable failing tests without explicit user request.
- Prefer minimal, reviewable diffs.
