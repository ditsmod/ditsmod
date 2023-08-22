# 05-nested-routes

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Простий приклад, як можна використовувати префікси на рівні застосунку та на рівні модуля.

Можете запустити застосунок з першого терміналу:

```bash
yarn start
```

З другого терміналу перевірити роботу:

```bash
curl -isS localhost:3000/api/posts
curl -isS localhost:3000/api/posts/123
curl -isS localhost:3000/api/posts/123/comments
curl -isS localhost:3000/api/posts/123/comments/456
```
