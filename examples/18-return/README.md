## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Return listener

Start from first terminal:

```bash
cd examples/18*
npm run start:dev
```

From second terminal:

```bash
curl -i localhost:3000/first

# This request should stuck because FirstModule not have `return` feature
curl -i localhost:3000/first-return

# This requests should works
curl -i localhost:3000/second
curl -i localhost:3000/second-json
curl -i localhost:3000/second-string
```
