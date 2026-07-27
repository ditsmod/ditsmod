## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Controller error handler

Start from first terminal:

```bash
cd examples/02*
npm start
```

From second terminal:

```bash
curl -i localhost:3000/hello
curl -i localhost:3000/throw-error
curl -i localhost:3000/hello2
curl -i localhost:3000/throw-error2
```
