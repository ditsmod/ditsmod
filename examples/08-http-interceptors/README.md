## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## HTTP interceptors

Start from first terminal:

```bash
yarn start8
```

From second terminal:

```bash
curl -isS localhost:3000
```

and see in first terminal

```text
[DefaultLogger:info] MyHttpInterceptor works!
```
