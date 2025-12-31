---
sidebar_position: 11
---

# ModuleManager

Metadata that you add to module decorators can be called "raw" metadata. The first stage of its processing takes place in the `ModuleManager` service. This service recursively scans all modules, starting from the root module, then normalizes and checks for correctness. `ModuleManager` has methods to find the metadata of specific modules, as well as methods for adding or removing module imports in the normalized representation (i.e. the raw metadata is not changed).

The work done by `ModuleManager` is used to initialize the application.
