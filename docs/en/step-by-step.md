## Step 1.

```bash
mkdir restify-ts
cd restify-ts
git clone git@github.com:restify-ts/core.git
git checkout step1
npm i
```

Adding to our application the `requestListener` method, which answers any HTTP reques with 'Hello World!'.

## Step 2.

```bash
git checkout step2
npm i
```

Adding the ability to pass options to the application constructor.

## Step 3.

```bash
git checkout step3
npm i
```

Implement DI at the application level and use it to pass a logger.

## Step 4.

```bash
git checkout step4
npm i
```

Implement DI at the level of HTTP requests.

## Step 5.

```bash
git checkout step5
npm i
```

Adding a router.

## Step 6.

```bash
git checkout step6
npm i
```

Adding a service to the controller, and send messages from that service.

## Step 7.

```bash
git checkout step7
npm i
```

Adding enum `Status` with all HTTP statuses.

## Step 8.

```bash
git checkout step8
npm i
```

Place the test application files the way they can be placed in a real project.

## Step 9.

```bash
git checkout step9
npm i
```

Substitute our logger for DI to replace the default application logger.

## Step 10.

```bash
git checkout step10
npm i
```

Rewrite `Response#send()` method.

## Step 11.

```bash
git checkout step11
npm i
```

Added `res.redirect()` method.

## Step 12.

```bash
git checkout step12
npm i
```

Extends the `Logger`, adding class and the` LoggerMethod` interface, as well as the `Request#toString()`, `Response#toString()` methods.

## Step 13.

```bash
git checkout step13
npm i
```

Adding `Request#queryParams` property.

## Step 14.

```bash
git checkout step14
npm i
```

Moved from `Application` to` Request` and `Response` some of the code that can be configured through inheritance.
