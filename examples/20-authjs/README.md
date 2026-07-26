# Example 20 - Auth.js Integration

This example demonstrates how to integrate [Auth.js](https://authjs.dev/) into a Ditsmod REST application using the `@ditsmod/authjs` module.

## Key Features Demonstrated

- **Credentials Provider**: Configuring credential-based authentication with username/password verification (`johnsmith` / `password123`).
- **Session Enrichment**: Using Auth.js `jwt` and `session` callbacks to enrich the user session with custom claims (such as `role: 'admin'`).
- **Route Guard Protection**: Restricting access to sensitive endpoints (`/profile`) using `AuthjsGuard` and retrieving session data with `@ctx(AUTHJS_SESSION)`.
- **Optional Authentication**: Dynamically checking authentication state on public endpoints (`/status`) using the `getSession` function without blocking guest access.

## Prerequisites

If you haven't installed dependencies in the repository yet, run from the project root:

```bash
npm install
```

## Running the Example

Start the dev server from the terminal:

```bash
cd examples/20-authjs
npm run start
```

Open your browser at http://localhost:3000/

For more comprehensive information, see the Ditsmod documentation: https://ditsmod.github.io/en/native-modules/authjs/
