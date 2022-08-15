# About the project

Ditsmod module to integration [i18next-fs-backend](https://github.com/i18next/i18next-fs-backend) (internalization).

## Settings

Expected directory tree for current module:

```text
├── your-modulename
│   ├── ...
│   └── locales
│       ├── current
│       │   ├── en
│       │   └── uk
│       └── imported
│           ├── one
│           │   ├── en
│           │   └── uk
│           └── two
│               ├── en
│               └── uk
```

Where `one` and `two` this is external module that alsow has `i18next-fs-backend` integration.
