---
sidebar_position: 3
title: AppInitializer
---

`AppInitializer` координує процес збірки застосунку в Holu. Окрім делегування завдань до `ShallowModulesImporter`, `ExtensionManager` та `DeepModulesImporter`, він розв'язує колізії `providersPerApp`, забезпечує етапи роботи розширень, створює інжектори на рівні застосунку та модулів, і підтримує повторну ініціалізацію застосунку (`reinit()`).
