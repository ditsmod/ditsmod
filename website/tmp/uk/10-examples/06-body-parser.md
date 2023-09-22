# 06-body-parser

Щоб спробувати даний приклад, необхідно спочатку [підготувати передумови](./prerequisite).

Можете запустити застосунок з першого терміналу:

```bash
npm start
```

З другого терміналу перевірити роботу:

```bash
curl -i localhost:3000 -d '{"one":1}' -H 'content-type: application/json'
```
