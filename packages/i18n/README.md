# About the project

Ditsmod module to support i18n (internalization).

## Settings

Recommended directory tree for current module:

```text
└── your-modulename
    ├── ...
    ├── locales
    │   ├── current
    │   │   ├── en
    │   │   ├── uk
    │   │   └── translations.ts
    │   └── imported
    │       ├── one
    │       │   ├── en
    │       │   ├── uk
    │       │   └── translations.ts
    │       └── two
    │           ├── en
    │           ├── uk
    │           └── translations.ts
```

Where `one` and `two` this are external modules that alsow has `@ditsmod/i18n` integration. File `translations.ts` has translation groups:

```ts
import { TranslationGroup } from '@ditsmod/i18n';

import { Common } from './en/common';
import { CommonUk } from './uk/common';
import { Errors } from './en/errors';
import { ErrorsUk } from './uk/errors';

export const currentTranslations: TranslationGroup[] = [
  [Common, CommonUk],
  [Errors, ErrorsUk],
];
```
