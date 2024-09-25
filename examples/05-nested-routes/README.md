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
cd examples/05*
npm run start:dev
```

From second terminal:

```bash
curl -i localhost:3000/api/posts
curl -i localhost:3000/api/posts/123
curl -i localhost:3000/api/posts/123/comments
curl -i localhost:3000/api/posts/123/comments/456
```
