## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Example with used JSON Web Token

Start from first terminal:

```bash
cd examples/14*
npm run start:dev
```

From second terminal:

```bash
curl -i localhost:3000

# Returns token with encoded your name.
curl -i localhost:3000/get-token-for/:your-name

# Return response with 401 status.
curl -i localhost:3000/profile

# Input token here and you are in your "profile".
curl -i localhost:3000/profile -H 'Authorization: Bearer <you-token>'
```
