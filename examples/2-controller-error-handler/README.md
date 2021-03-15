## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git ditsmod/ditsmod
cd ditsmod/ditsmod
npm i
```

## Controller error handler

Check from first terminal:

```bash
npm run start2
```

From second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/throw-error
```
