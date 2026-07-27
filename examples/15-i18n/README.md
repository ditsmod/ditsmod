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
curl -i localhost:3000/first?lng=en
curl -i localhost:3000/first?lng=pl
curl -i localhost:3000/first-extended?lng=en
curl -i localhost:3000/first-extended?lng=pl
curl -i localhost:3000/first-extended?lng=uk
curl -i localhost:3000/second/your-name?lng=en
curl -i localhost:3000/second/your-name?lng=uk
curl -i localhost:3000/third?lng=en
curl -i localhost:3000/third?lng=pl
```
