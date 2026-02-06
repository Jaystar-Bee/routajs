<p align="center">
  <img src="./assets/logo.png" alt="routajs" width="500" />
</p>

# routajs

A lightweight, framework-agnostic router plugin for JavaScript and TypeScript applications. Designed to be robust, flexible, and capable of handling both Client-Side Rendering (CSR) and Server-Side Rendering (SSR).

## Features

- **Framework Agnostic**: Works with any UI framework or vanilla JS.
- **SSR Ready**: Built-in Memory history support for server-side environments.
- **Typescript**: Written in TypeScript with full type definitions.
- **Navigation Guards**: Comprehensive global (`beforeEach`, `afterEach`) guards.
- **Flexible API**: Inspired by modern router standards (Vue Router, React Router).
- **Route Tracking**: Built-in access to `previousFullPath` for easy navigation history tracking.
- **Param & Query Parsing**: Automatic parsing of path parameters and query strings.

## Installation

```bash
npm install routajs
```

## Architecture

Routajs is built on three core pillars that interact to provide a seamless routing experience:

### 1. The Router Core
The `Router` class is the main entry point. It manages the application state (`currentRoute` and `previousRoute`), handles the navigation lifecycle, and orchestrates the interaction between the Matcher and History.

### 2. The Matcher
The `Matcher` is responsible for parsing your route definitions. It converts paths like `/user/:id` into regular expressions.
- **Normalization**: Converts route records into optimized matchers.
- **Resolution**: Resolves incoming paths or named routes to full `Route` objects, extracting parameters (`params`) and `meta` data.

### 3. The History
The `History` module abstracts the underlying navigation mechanism.
- **HTML5 History**: Uses the browser's `pushState` and `popState` APIs.
- **Hash History**: Uses the URL hash (`#`) for navigation (legacy support).
- **Memory History**: Maintains an internal history stack, crucial for Node.js/SSR environments.

## How It Works

When you trigger a navigation (e.g., `router.push('/about')`):

1.  **Resolution**: The Router asks the Matcher to resolve the target location.
2.  **Guard Check**: The Router executes all registered `beforeEach` guards sequentially. If any guard calls `next(false)` or `next('/other-route')`, the navigation is cancelled or redirected.
3.  **Commit**: If passed, the `History` module updates the URL.
4.  **Update**: The Router updates its internal state (`currentRoute`) and fires `afterEach` hooks and listeners.

## Usage

### Defining Routes

Routajs supports dynamic segments and wildcards for flexible routing.

#### Dynamic Segments
Use a colon `:` to define dynamic parameters in your route path.

```typescript
const routes = [
  { 
    path: '/users/:id', 
    component: UserDetail 
  }
];
// Matches: /users/1, /users/abc
// Accessed via: router.current.params.id
```

#### Catch-all / 404 Not Found
Use an asterisk `*` to match anything. This is commonly used for 404 pages.

```typescript
const routes = [
  // ... other routes
  { 
    path: '/about/*', 
    component: AboutSection 
  },
  // Matches: /about/team, /about/contact

  // Global 404 - matches everything not matched above
  { 
    path: '*', 
    component: NotFound 
  }
];
```

### Best Practices: Project Structure

It is recommended to define your router in a dedicated file (e.g., `src/router.ts`) and export the instance. This allows you to import it anywhere in your application.

**src/router.ts**
```typescript
import { createRouter, createWebHistory } from 'routajs';
import Home from './views/Home';
import About from './views/About';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ]
});
```

**src/main.ts**
```typescript
import { router } from './router';

// Initialize your app
router.listen((route) => {
  // Trigger a re-render of your app
});
```

### Accessing Route Details

You can access the current route state at any time via `router.current`.

```typescript
import { router } from './router';

console.log(router.current.matched); // Array of matched route records
console.log(router.current.params);  // path parameters
console.log(router.current.query);   // query parameters
```

### Framework Integration

Routajs is framework-agnostic, but here is how you can easily integrate it with popular frameworks.

#### React Example

```tsx
import { useState, useEffect } from 'react';
import { router } from './router';

export function useRoute() {
  const [route, setRoute] = useState(router.current);

  useEffect(() => {
    return router.listen((newRoute) => {
      setRoute(newRoute);
    });
  }, []);

  return route;
}

// Usage in component
const MyComponent = () => {
    const route = useRoute();
    return <div>Current Path: {route.fullPath}</div>;
};
```

#### Vue Example

```typescript
import { ref } from 'vue';
import { router } from './router';

const route = ref(router.current);

router.listen((newRoute) => {
  route.value = newRoute;
});

export function useRoute() {
  return route;
}
```

### Navigation Guards

Routajs supports async navigation guards.

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // Redirect to login
    next('/login');
  } else {
    // Continue
    next();
  }
});
```

### SSR Usage

For Server-Side Rendering, use `createMemoryHistory`.

```typescript
import { createRouter, createMemoryHistory } from 'routajs';

// On the server
const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
});

// Push the incoming request URL to the router
router.push(req.url);

// The router is now in the correct state to render your app
const context = { route: router.current };
```

## API

### `Route` Object

The route object contains all information about the current route:

- `fullPath`: string (e.g., `/user/123?q=search`)
- `path`: string (e.g., `/user/123`)
- `params`: object (e.g., `{ id: '123' }`)
- `query`: object (e.g., `{ q: 'search' }`)
- `hash`: string
- `name`: string | symbol | undefined
- `meta`: object
- `previousFullPath`: string | null (The full path of the previous route)

## License

MIT
