# 05-nested-routes

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Простий приклад, як можна використовувати префікси на рівні застосунку та на рівні модуля.

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
yarn start5
```

З другого терміналу:

```bash
curl -isS localhost:8080/api/posts
curl -isS localhost:8080/api/posts/123
curl -isS localhost:8080/api/posts/123/comments
curl -isS localhost:8080/api/posts/123/comments/456
```
