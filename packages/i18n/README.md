# About the project

Ditsmod module to support i18n (internalization).

## Settings

Recommended directory tree for current module:

```text
└── your-modulename
    ├── ...
    ├── locales
    │   ├── current
    │   │   ├── _base-en
    │   │   ├── de
    │   │   ├── fr
    │   │   ├── pl
    │   │   ├── uk
    │   │   └── index.ts
    │   └── imported
    │       ├── one
    │       │   ├── de
    │       │   ├── fr
    │       │   ├── pl
    │       │   └── uk
    │       ├── two
    │       │   ├── de
    │       │   ├── fr
    │       │   ├── pl
    │       │   └── uk
    │       └── index.ts
```

Where `_base-en` - this is the base translation from which all other translations for the current module branch.
And `one` and `two` this are external modules that alsow has `@ditsmod/i18n` integration. File `index.ts` has translation groups:

```ts
import { TranslationGroup } from '@ditsmod/i18n';

import { Common } from './en/common';
import { CommonUk } from './uk/common';
import { Errors } from './en/errors';
import { ErrorsUk } from './uk/errors';

export const current: TranslationGroup[] = [
  [Common, CommonUk],
  [Errors, ErrorsUk],
];
```
