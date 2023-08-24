## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Hello world

Start from first terminal:

```bash
cd examples/15*
npm start
```

From second terminal:

```bash
curl -isS localhost:3000/first?lng=en
curl -isS localhost:3000/first?lng=pl
curl -isS localhost:3000/first-extended?lng=en
curl -isS localhost:3000/first-extended?lng=pl
curl -isS localhost:3000/first-extended?lng=uk
curl -isS localhost:3000/second/your-name?lng=en
curl -isS localhost:3000/second/your-name?lng=uk
curl -isS localhost:3000/third?lng=en
curl -isS localhost:3000/third?lng=pl
```
