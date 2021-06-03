---
order: 1
prefix: $
title: el
---

# `$el`

`$el` is a magic property that can be used to retrieve the current DOM node.

```html
<button @click="$el.innerHTML = 'foo'">Replace me with "foo"</button>
```

<!-- START_VERBATIM -->
<div class="demo">
    <div x-data>
        <button @click="$el.textContent = 'Hello World!'">Replace me with "Hello World!"</button>
    </div>
</div>
<!-- END_VERBATIM -->
