## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Dynamically composing modules

Run from first terminal:

```bash
yarn start7
```

Check from second terminal:

```bash
curl -isS localhost:8080

# 404 from second module
curl -isS localhost:8080/get-2

# Adding second module
curl -isS localhost:8080/add-2

# 200 from second module
curl -isS localhost:8080/get-2

# During adding third module, should failed
curl -isS localhost:8080/add-3

# But other modules continue works
curl -isS localhost:8080
curl -isS localhost:8080/get-2

# Removing second module
curl -isS localhost:8080/del-2

# 404 from second module
curl -isS localhost:8080/get-2

# But OK first module
curl -isS localhost:8080
```
