# Contributing to Ditsmod

Thank you for your interest in contributing to Ditsmod! 🎉  
Every contribution — whether it's a bug report, a documentation fix, or a new feature — is greatly appreciated.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Git Commit Message Conventions](#git-commit-message-conventions)

---

## Code of Conduct

Please be respectful and constructive in all interactions. This project follows the Contributor Covenant. By participating, you agree to uphold a welcoming and harassment-free environment for everyone.

---

## Ways to Contribute

- **Report bugs** – Open a [GitHub Issue](https://github.com/ditsmod/ditsmod/issues) with a clear description and reproduction steps.
- **Suggest features** – Open an issue tagged `enhancement` to discuss ideas before implementing.
- **Fix bugs or add features** – Pick up an existing [open issue](https://github.com/ditsmod/ditsmod/issues) (look for `good first issue` or `help wanted` labels).
- **Improve documentation** – Docs live in `website/i18n/en/docusaurus-plugin-content-docs/current/`.

> [!NOTE]
> Please open or comment on an issue before submitting a non-trivial PR so we can discuss the approach and avoid wasted effort.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 24.0.0
- **Corepack** (ships with Node.js ≥ 16.9.0)
- **Yarn** 4.x (managed via Corepack)

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/ditsmod.git
cd ditsmod

# 2. Enable Corepack and install the correct Yarn version
corepack enable
corepack install

# 3. Install all workspace dependencies
yarn install

# 4. Build all packages
yarn prepare
yarn build-openapi-ui
```

After these steps, all packages under `packages/*` are symlinked into `node_modules`, and changes to package source files are automatically reflected in the example applications under `examples/*`.

---

## Development Workflow

This monorepo uses **Yarn workspaces**. The key directories are:

| Directory      | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `packages/`    | Publishable npm packages (e.g. `@ditsmod/core`, `@ditsmod/rest`) |
| `examples/`    | Runnable example applications                                    |
| `experiments/` | Experimental work, not part of the public API                    |
| `website/`     | Docusaurus documentation site                                    |

### Running an example application

```bash
cd examples/01-hello-world
yarn start:dev
```

### Previewing the documentation

```bash
yarn docs-en
```

---

## Running Tests

```bash
# Run all unit tests
yarn test

# Run all tests including examples
yarn test-all

# Run authjs-specific integration tests
yarn test-authjs

# Run example e2e tests
yarn test-examples
```

> [!IMPORTANT]
> Make sure all tests pass before submitting a Pull Request.

---

## Pull Request Guidelines

1. **Branch off `main`** — create a feature branch: `git checkout -b feat/my-feature`.
2. **Keep PRs focused** — one logical change per PR makes review easier.
3. **Write or update tests** for any changed behavior.
4. **Update documentation** if your change affects the public API.
5. **Ensure CI passes** — the build, linting, and tests must all be green.
6. **Fill in the PR description** — describe what changed and why, and link the related issue if applicable.

---

## Git Commit Message Conventions

We use **Conventional Commits** for all commits. A pre-commit hook (via Husky and commitlint) is configured to validate your commit message format before allowing a commit to be created.

### Format

Every commit message must follow this structure:

```text
<type>(<scope>): <description>
```

#### 1. Allowed Types (`<type>`)

Common types from Conventional Commits:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation-only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

#### 2. Allowed Scopes (`<scope>`)

The scope is **mandatory** (commits without a scope will be rejected). The scope must be in parentheses and be one of the following:

- **Packages under `packages/`**: Use the package folder name directly (omitting the `@ditsmod/` prefix). For example:
  - `core` (for `@ditsmod/core`)
  - `authjs` (for `@ditsmod/authjs`)
  - `body-parser` (for `@ditsmod/body-parser`)
  - etc.
- **`website`**: Changes to the documentation website (`website/`).
- **`examples`**: Changes to the runnable applications under `examples/`.
- **`ci`**: Repository-wide configurations (e.g. root `package.json`, `tsconfig.json`, `yarn.lock`, GitHub Actions workflows).

### Examples

- **Valid commits:**
  - `feat(core): add new DI features`
  - `chore(website): update yarn.lock dependencies`
  - `chore(ci): configure tsconfig.json`
  - `fix(authjs): resolve validation token bug`

- **Invalid commits (will be rejected):**
  - `chore: update dependencies` (missing scope)
  - `feat(invalid-scope): add feature` (scope is not in the allowed list)
