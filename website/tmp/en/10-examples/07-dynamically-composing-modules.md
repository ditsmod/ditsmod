# 07-composing-modules

To try this example, you should first [prepare the prerequisite][1].

Ditsmod has the ability to add and remove modules after starting the web server, without the need to restart the web server, and HTTP clients will not notice interruptions when adding or removing these modules.

You can run the application from the first terminal:

```bash
yarn start
```

From the second terminal check the work:

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


[1]: /examples/prerequisite
