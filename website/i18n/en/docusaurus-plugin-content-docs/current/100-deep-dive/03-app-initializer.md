---
sidebar_position: 3
title: BaseAppInitializer
---

`BaseAppInitializer` orchestrates application bootstrapping in Ditsmod. Beyond delegating tasks to `ShallowModulesImporter`, `ExtensionManager`, and `DeepModulesImporter`, it resolves `providersPerApp` collisions, ensures extension execution stages, creates injectors at the application and module levels, and supports application re-initialization (`reinit()`).
