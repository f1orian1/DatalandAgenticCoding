Frontend Development Rules
These rules apply in particular whenever a new Frontend Component is developped.
1. PrimeVue
1a. Do not build unneccessary component wrappers. Find the appropriate component, read and understand the component API, and check the properties provided by the component. Use the component's API to modify its behaviour.
1b. Do not use FormKit. FormKit comes with its own UI. Use the form elements provided by PrimeVue instead. If you need a proper validation, use zod as validation tool.
1c. Do not access the PrimeVue CSS classes on a local scope. Modify a component's styling globally by modifying the according preset.
1d. Do not use :deep(). If you really need to customize a single component, use PrimeVue's PassThrough API.
2. Frontend Layout, Styling, CSS
2a. Do not use PrimeFlex classes. PrimeFlex is sunsetted.
2b. Do not use material icons. Use prime icons instead.
2c. Do not use scoped styles if not absolutely necessary. Do not modify the design of PrimeVue components via scoped styles.
2d. Use PrimeVue's Design-Tokens to modify the design of PrimeVue components.
2e. Each Design-Token corresponds to a CSS variable. Make use of these CSS variables.
2f. Do not use :deep(). If you really need to customize a single component, use PrimeVue's PassThrough API.
2g. Using scoped styles is only admissible for structuring the general layout of your component and positioning your elements. For structuring your component, use div-containers with custom CSS classes. Your custom CSS classes may only modify structural CSS properties like display (grid or flex), padding, margin and so on.
If you want to modify the design for a single component, don't. If you think it is necessary, it is not.
2h. Do not copy old code. Work under the assumption that the code you're looking at does not follow the best practices laid out by these rules.