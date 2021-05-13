## Alpine V3

### Quick Tour
You can get everything installed with: `npm install` in the root directory of this repo after cloning it locally.

This repo is a "mono-repo" using npm workspaces for managing the packages. Each package has its own folder in the `/packages` directory.

Rather than having to run seperate builds for each package, all package bundles are handled with the same command: `npm run build`

Here's a brief look at each package in this repo:

Package | Description
--- | ---
[alpinejs](packages/alpinejs) | The main Alpine repo with all of Alpine's core
[csp](packages/csp) | A repo to provide a "CSP safe" build of Alpine
[history](packages/history) | A plugin for binding data to query string parameters using the history API (name is likely to change)
[intersect](packages/intersect) | A plugin for triggering JS expressions based on elements intersecting with the viewport
[morph](packages/morph) | A plugin for morphing HTML (like morphdom) inside the page intelligently

### Testing
There are 2 different testing tools used in this repo: Cypress (for integration tests), and Jest (for unit tests).

All tests are stored inside the `/tests` folder under `/tests/cypress` and `/tests/jest`.

You can run them both from the command line using: `npm run test`

If you wish to only run cypress and open it's user interface (recommended during development), you can run: `npm run cypress`

If you wish to only run Jest tests, you can run `npm run jest` like normal and target specific tests. You can specify command line config options to forward to the jest command with `--` like so: `npm run jest -- --watch`
