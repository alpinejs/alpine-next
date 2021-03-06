---
order: 5
title: dispatch
---

# `$dispatch`

`$dispatch` is a helpful shortcut for dispatching browser events.

```html
<div @notify="alert('Hello World!')">
    <button @click="$dispatch('notify')">
        Notify
    </button>
</div>
```

<!-- START_VERBATIM -->
<div class="demo">
    <div x-data @notify="alert('Hello World!')">
        <button @click="$dispatch('notify')">
            Notify
        </button>
    </div>
</div>
<!-- END_VERBATIM -->

You can also pass data along with the dispatched event if you wish. This data will be accessible as the `.detail` property of the event:

```html
<div @notify="alert($event.detail.message)">
    <button @click="$dispatch('notify', { message: 'Hello World!' })">
        Notify
    </button>
</div>
```

<!-- START_VERBATIM -->
<div class="demo">
    <div x-data @notify="alert($event.detail.message)">
        <button @click="$dispatch('notify', { message: 'Hello World!' })">Notify</button>
    </div>
</div>
<!-- END_VERBATIM -->


Under the hood, `$dispatch` is a wrapper for the more verbose API: `element.dispatchEvent(new CustomEvent(...))`

**Note on event propagation**

Notice that, because of [event bubbling](https://en.wikipedia.org/wiki/Event_bubbling), when you need to capture events dispatched from nodes that are under the same nesting hierarchy, you'll need to use the [`.window`](https://github.com/alpinejs/alpine#x-on) modifier:

**Example:**

```html
<!-- 🚫 Won't work -->
<div x-data>
    <span @notify="..."></span>
    <button @click="$dispatch('notify')">
<div>

<!-- ✅ Will work (because of .window) -->
<div x-data>
    <span @notify.window="..."></span>
    <button @click="$dispatch('notify')">
<div>
```

> The first example won't work because when `custom-event` is dispatched, it'll propagate to its common ancestor, the `div`, not it's sibling, the `<span>`. The second example will work because the sibling is listening for `notify` at the `window` level, which the custom event will eventually bubble up to.

<a name="dispatching-to-components"></a>
## Dispatching to other components

You can also take advantage of the previous technique to make your components talk to each other:

**Example:**

```html
<div
    x-data="{ title: 'Hello' }"
    @set-title.window="title = $event.detail"
>
    <h1 x-text="title"></h1>
</div>

<div x-data>
    <button @click="$dispatch('set-title', 'Hello World!')">...</button>
</div>
<!-- When clicked, will console.log "Hello World!". -->
```

<a name="dispatching-to-x-model"></a>
## Dispatching to x-model

You can also use `$dispatch()` to trigger data updates for `x-model` data bindings. For example:

```html
<div x-data="{ title: 'Hello' }">
    <span x-model="title">
        <button @click="$dispatch('input', 'Hello World!')">
        <!-- After the button is pressed, `x-model` will catch the bubbling "input" event, and update title. -->
    </span>
</div>
```

This opens up the door for making custom input components who's value can be set via `x-model`.
