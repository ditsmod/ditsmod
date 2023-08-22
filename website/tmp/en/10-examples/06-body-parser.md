# 06-body-parser

To try this example, you should first [prepare the prerequisite][1].

You can run the application from the first terminal:

```bash
yarn start
```

From the second terminal check the work:

```bash
curl -isS localhost:3000 -d '{"one":1}' -H 'content-type: application/json'
```

[1]: /examples/prerequisite
