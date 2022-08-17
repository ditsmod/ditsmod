# About the project

Ditsmod module to support i18n (internalization).

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

Where `one` and `two` this is external module that alsow has `i18n` integration.
