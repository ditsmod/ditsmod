## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Dynamically composing modules

Start from first terminal:

```bash
cd examples/07*
npm start
```

Check from second terminal:

```bash
curl -isS localhost:3000

# 404 from second module
curl -isS localhost:3000/get-2

# Adding second module
curl -isS localhost:3000/add-2

# 200 from second module
curl -isS localhost:3000/get-2

# During adding third module, should failed
curl -isS localhost:3000/add-3

# But other modules continue works
curl -isS localhost:3000
curl -isS localhost:3000/get-2

# Removing second module
curl -isS localhost:3000/del-2

# 404 from second module
curl -isS localhost:3000/get-2

# But OK first module
curl -isS localhost:3000
```
