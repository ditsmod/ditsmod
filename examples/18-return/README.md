## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
```

## Return listener

Start from first terminal:

```bash
yarn start
```

From second terminal:

```bash
curl -isS localhost:3000/first

# This request should stuck because FirstModule not have `return` feature
curl -isS localhost:3000/first-return

# This requests should works
curl -isS localhost:3000/second
curl -isS localhost:3000/second-json
curl -isS localhost:3000/second-string
```
