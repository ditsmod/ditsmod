## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Session cookie

Start from first terminal:

```bash
yarn start
```

From second terminal:

```bash
curl -isS localhost:3000/set
curl -isS localhost:3000/get -H 'cookie: custom-session-name=123'
```
