## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## HTTP interceptors

Start from first terminal:

```bash
cd examples/08*
npm start
```

From second terminal:

```bash
curl -i localhost:3000
```

and see in first terminal

```text
[DefaultLogger:info] MyHttpInterceptor works!
```
