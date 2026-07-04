# Ditsmod Framework — Agent Rules

This file provides rules and context for AI agents working inside the **Ditsmod framework monorepo** (specifically on the framework core and packages).

> [!IMPORTANT]
>
> - **For general coding style, naming conventions, and Ditsmod application design rules**, refer to: [Application Developer Agent Rules (Local)](file:///srv/git/ditsmod/agent-skills/AGENTS.md) or [GitHub Mirror](https://github.com/ditsmod/agent-skills/blob/main/AGENTS.md).
> - **For specific guidelines on Ditsmod components (DI, Modules, Extensions, etc.)**, refer to: [Ditsmod Agent Skills (Local)](file:///srv/git/ditsmod/agent-skills/skills) or [GitHub Mirror](https://github.com/ditsmod/agent-skills/tree/main/skills).
> - **Scope of Application Rules**: Use the application developer rules mentioned above when working on directories containing runnable example applications (e.g., `examples/*`, `packages/*/e2e/*` tests or `experiments/*`).

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
