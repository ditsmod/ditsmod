# 06-body-parser

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Перевірити роботу прикладу можна так, з першого терміналу:

```bash
yarn start6
```

З другого терміналу:

```bash
curl -isS localhost:8080 -d '{"one":1}' -H 'content-type: application/json'
```
