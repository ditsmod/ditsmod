## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ts-stack/ditsmod.git
cd ditsmod
npm i
```

## Logger

Check from first terminal:

```bash
npm run start4
```

From second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/winston
curl -isS localhost:8080/bunyan
curl -isS localhost:8080/pino
```

As you can see, there are examples for [bunyan][1], [pino][2] and [winston][3] loggers.
They work in one application, but in different modules.

[1]: https://github.com/trentm/node-bunyan
[2]: https://github.com/pinojs/pino
[3]: https://github.com/winstonjs/winston
