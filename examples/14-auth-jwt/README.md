## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Example with used JSON Web Token

Start from first terminal:

```bash
yarn start14
```

From second terminal:

```bash
curl -isS localhost:8080

# Returns token with encoded your name.
curl -isS localhost:8080/get-token-for/:your-name

# Return response with 401 status.
curl -isS localhost:8080/profile

# Input token here and you are in your "profile".
curl -isS localhost:8080/profile -H 'Authorization: Bearer <you-token>'
```
