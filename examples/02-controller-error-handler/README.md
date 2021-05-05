## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Controller error handler

Start from first terminal:

```bash
yarn start2
```

From second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/throw-error
```
