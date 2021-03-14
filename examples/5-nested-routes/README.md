## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git ditsmod/core
cd ditsmod/core
npm i
```

## Nested routes

Check from first terminal:

```bash
npm run start5
```

From second terminal:

```bash
curl -isS localhost:8080/api/posts
curl -isS localhost:8080/api/posts/123
curl -isS localhost:8080/api/posts/123/comments
curl -isS localhost:8080/api/posts/123/comments/456
```
