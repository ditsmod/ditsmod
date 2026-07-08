# Ditsmod Framework — Agent Rules

This file provides rules and context for AI agents working inside the **Ditsmod framework monorepo** (specifically on the framework core and packages).

> [!IMPORTANT]
>
> - **For general coding style, naming conventions, and Ditsmod application design rules**, refer to: [Application Developer Agent Rules (Local)](file:///srv/git/ditsmod/agent-skills/AGENTS.md) or [GitHub Mirror](https://github.com/ditsmod/agent-skills/blob/main/AGENTS.md).
> - **For specific guidelines on Ditsmod components (DI, Modules, Extensions, etc.)**, refer to: [Ditsmod Agent Skills (Local)](file:///srv/git/ditsmod/agent-skills/skills) or [GitHub Mirror](https://github.com/ditsmod/agent-skills/tree/main/skills).
> - **Scope of Application Rules**: Use the application developer rules mentioned above when working on directories containing runnable example applications (e.g., `examples/*`, `packages/*/e2e/*` tests or `experiments/*`).

> [!NOTE]
> `@ts-stack/*` packages are always published with their source files in the `src` folder, so agents can utilize them if needed.

---

## Repository Overview

Ditsmod is a Node.js web framework written in TypeScript (ESM). Its name reflects its three pillars:
**DI** (Dependency Injection) + **TS** (TypeScript) + **Mod** (Modularity).

This is a **Yarn workspaces monorepo**. Key top-level directories:

| Directory      | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `packages/`    | All publishable npm packages (e.g. `@ditsmod/core`, `@ditsmod/rest`) |
| `examples/`    | Runnable example applications demonstrating framework features       |
| `experiments/` | Experimental / in-progress work, not yet part of the public API      |
| `website/`     | Docusaurus documentation site                                        |

English documentation lives at:
`website/i18n/en/docusaurus-plugin-content-docs/current/`

## Documentation

The website is a Docusaurus project. English docs live at:

```
website/i18n/en/docusaurus-plugin-content-docs/current/
  01-basic-components/   # DI, modules, extensions, logger, errors
  02-rest-application/   # REST-specific features
  03-trpc-application/   # tRPC-specific features
  10-guide/              # Coding conventions and guides
  100-deep-dive/         # Internals: app workflow, module manager, init decorators
```

When adding or modifying public API, update the corresponding documentation file.
Run `yarn docs-en` to preview changes locally.

### Documentation Translation & Synchronization Rules for the `website/` Directory

- **Multi-language updates**: When updating website documentation, update both the English and Ukrainian versions.
- **Line-by-line synchronization**: The English and Ukrainian documentation files must always be synchronized line-by-line. For example, if a header starts at line `N` in the Ukrainian version, the corresponding English header must also start at line `N`.
- **Header IDs**: Every header must have an ID in English using the syntax: `## Some header {#some-header}` where `{#some-header}` is the ID.

---

## Verification

- **Running Prettier**: The agent must run Prettier to auto-format every new or modified file before finishing changes (e.g., `npx prettier --write path/to/file.ts`).
- **Running ESLint**: After completing any code changes, the agent must run ESLint. To avoid running it for the entire project (which can cause memory issues), run it only for the modified packages (e.g., `yarn lint packages/cli` from the project root) or specifically for the modified files.
- **Running Tests**: Run tests only if there are code changes (running tests is not required for documentation or comment-only changes). To run unit tests for a specific package, the agent should run them using the package workspace (e.g., `yarn workspace @ditsmod/cli test` or `yarn --cwd packages/cli test`). Avoid running `yarn test packages/<package-name>` from the root of the project, as this compiles tests for the entire monorepo and can fail due to compilation errors in other packages.

---

## Language Rules

- **Ukrainian Language**:
  - When communicating or writing in Ukrainian, the English term **"application"** (or **"app"**) must either remain in English, or be translated as **"застосунок"**.
  - **Do NOT** translate it as **"додаток"**.
