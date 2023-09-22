## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Nested routes

Start from first terminal:

```bash
cd examples/06*
npm start
```

From second terminal:

```bash
curl -i localhost:3000 -d '{"one":1}' -H 'content-type: application/json'
```
