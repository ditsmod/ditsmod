## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Session cookie

Start from first terminal:

```bash
cd examples/19*
npm start
```

From second terminal:

```bash
curl -i localhost:3000/set
curl -i localhost:3000/get -H 'cookie: custom-session-name=123'
```
