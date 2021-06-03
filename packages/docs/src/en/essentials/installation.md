---
order: 1
title: Installation
---

# Installation

There are 2 ways to include Alpine into your project:

* Including it from a `<script>` tag
* Importing it as a module

Either is perfectly valid. It all depends on the project's needs and the developer's taste.

<a name="from-a-script-tag"></a>
## From a script tag

This is by far the simplest way to get started with Alpine. Include the following `<script>` tag in the head of your HTML page.

```html
<html>
  <head>
    ...

    <script defer src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.x.x/dist/alpine.min.js"></script>
  </head>
  ...
</html>
```

> Don't forget the "defer" attribute in the `<script>` tag.

Notice the `@v2.x.x` in the provided CDN link. This will pull the latest version of Alpine version 2. For stability in production, it's recommended that you hardcode the latest version in the CDN link.

```html
<script defer src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.3.4/dist/alpine.min.js"></script>
```

That's it! Alpine is now available for use inside your page.

<a name="as-a-module"></a>
## As a module

If you prefer the more robust approach, you can install Alpine via NPM and import it into a bundle.

Run the following command to install it.

```bash
npm install alpinejs
```

Now import Alpine into your bundle and initialize it like so:

```js
import Alpine from 'alpinejs'

window.Alpine = Alpine

Alpine.start()
```

> The `window.Alpine = Alpine` bit is optional, but is nice to have for freedom and flexibility. Like when tinkering with Alpine from the devtools for example.
