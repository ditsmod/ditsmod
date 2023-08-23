# 05-nested-routes

To try this example, you should first [prepare the prerequisite][1].

A simple example of how prefixes can be used at the application level and at the module level.

You can run the application from the first terminal:

```bash
npm start
```

From the second terminal check the work:

```bash
curl -isS localhost:3000/api/posts
curl -isS localhost:3000/api/posts/123
curl -isS localhost:3000/api/posts/123/comments
curl -isS localhost:3000/api/posts/123/comments/456
```

[1]: /examples/prerequisite
