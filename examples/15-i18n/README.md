## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Hello world

Start from first terminal:

```bash
yarn start15
```

From second terminal:

```bash
curl -isS localhost:3000/first
curl -isS localhost:3000/second?lng=en
curl -isS localhost:3000/second
curl -isS localhost:3000/second/your-name?lng=en
curl -isS localhost:3000/second/your-name
```
