## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
npm i
```

## HTTP interceptors

Check from first terminal:

```bash
npm run start8
```

From second terminal:

```bash
curl -isS localhost:8080
```

and see in first terminal

```text
[DefaultLogger:info] MyHttpInterceptor works!
```
