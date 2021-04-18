## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
npm i
```

## OpenAPI documentation

Run from first terminal:

```bash
npm run start10
```

Open your browser with http://localhost:8080/openapi and there
should be OpenAPI documentation.

Check from second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/one/123
curl -isS localhost:8080/one/123/two/456
curl -isS localhost:8080/posts/123
curl -isS localhost:8080/posts/123/comments/456
```
