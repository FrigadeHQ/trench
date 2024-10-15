# Frigade Documentation

The content and configuration powering the Frigade documentation available at [docs.frigade.com](https://docs.frigade.com)

### 👩‍💻 Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm i mintlify -g
```

Run the following command at the root of your documentation (where mint.json is)

```
mintlify dev
```

### 😎 Publishing Changes

Changes will be deployed to production automatically after pushing to the default branch.

You can also preview changes using PRs, which generates a preview link of the docs.

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Mintlify dev is updating really slowly - Run `mintlify clear` to clear the cache.

### Generating typescript prop docs

Simply run `node scripts/generate-docs.js` to generate the typescript prop docs for the components. Make sure `frigade-react` is available in the same parent directory as this one.
