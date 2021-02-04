<a name="beta.18"></a>
# [beta.18](https://github.com/ts-stack/ditsmod/releases/tag/beta.18) (2021-02-05)

### Changes

- Removed from optional dependencies previously added plugins (see [ef193c1](https://github.com/ts-stack/ditsmod/commit/ef193c1)).

<a name="beta.17"></a>
## [beta.17](https://github.com/ts-stack/ditsmod/releases/tag/beta.17) (2021-02-04)

### Features

- Improved error handling before logger init (see [d3fa051c](https://github.com/ts-stack/ditsmod/commit/d3fa051c)).
- Added default plugins to optional dependencies (see [cc61f8f](https://github.com/ts-stack/ditsmod/commit/cc61f8f)).
If developers don't want to use default plugins, they can put it this way:

```bash
npm i --no-optional
# OR
yarn --ignore-optional
```

<a name="beta.16"></a>
## [beta.16](https://github.com/ts-stack/ditsmod/releases/tag/beta.16) (2021-02-03)

### Changes

- Removed body parser and router from core.

