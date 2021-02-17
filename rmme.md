# Breaking Changes
* [`x-data` cascading scope](#x-data-cascading-scope)
* [`$el` is no longer the root](#el-is-no-longer-the-root)
* [Automatically evaluate `init()` functions defined on data object](#automatically-evaluate-init-functions-defined-on-data-object)
* [`x-init` no longer accepts a callback return](#x-init-no-longer-accepts-a-callback-return)
* [Must include `()` in method event handlers](#must-include--in-method-event-handlers)
* [Returning `false` from event handlers no longer implicitly "preventDefault"s](#returning-false-from-event-handlers-no-longer-implicitly-preventdefaults)
* [Binding classes with array syntax `[]` is no longer supported](#binding-classes-with-array-syntax--is-no-longer-supported)
* [`x-show.transition` is now `x-transition`](#x-showtransition-is-now-x-transition)
* [`x-spread` is now `x-bind`](#x-spread-is-now-x-bind)
* [Use global events instead of `Alpine.deferLoadingAlpine()`](#use-global-events-instead-of-alpinedeferloadingalpine)
* [IE11 no longer supported](#ie11-no-longer-supported)

## `x-data` cascading scope

Scope defined in `x-data` is now available to all children unless overwritten by a nested `x-data` expression.

```html
<!-- Before -->
<div x-data="{ foo: 'bar' }">
    <div x-data="{}">
        <!-- foo is undefined -->
    </div>
</div>

<!-- After -->
<div x-data="{ foo: 'bar' }">
    <div x-data="{}">
        <!-- foo is 'bar' -->
    </div>
</div>
```

## `$el` is no longer the root

`$el` now always represents the element that an expression was executed on, not the root element of the component. This will replace most usages of `x-ref` and in the cases where you still want to access the root of a component

```html
<!-- Before -->
<div x-data x-init="console.log($el)">
    <button @click="console.log($el)"></button>
    <!-- Both $els are the root <div> -->
</div>

<!-- After -->
<div x-data x-init="console.log($el)">
    <button @click="console.log($el)"></button>
    <!-- First $el is the root <div>, second is the <button> -->
</div>
```

## Automatically evaluate `init()` functions defined on data object

```html
<!-- Before -->
<div x-data="foo()" x-init="init()"></div>

<!-- After -->
<div x-data="foo()"></div>

<script>
    function foo() {
        return {
            init() {
                //
            }
        }
    }
</script>
```

## `x-init` no longer accepts a callback return

Before V3, if `x-init` received a return value that is `typeof` "function", it would execute the callback after Alpine finished initializing all other directives in the tree. Now, you must manually call `$nextTick()` to achieve that behavior. `x-init` is no longer "return value aware".

```html
<!-- Before -->
<div x-data x-init="() => { console.log($el.innerText) }" x-text="'foo'"></div>

<!-- After -->
<div x-data x-init="$nextTick(() => { console.log($el.innerText) })" x-text="'foo'"></div>
```

## Must include `()` in method event handlers

Before V3, Alpine would allow you to pass an event listener a function reference rather than calling it directly (Inspired by VueJS.) Now, Alpine is not aware of the return value of an event handler expression, it simply executes it. Therefore, you must now execute methods directly in the expression.

```html
<!-- Before -->
<div x-data="{ foo() { ... }">
    <button @click="foo"></button>
</div>

<!-- After -->
<div x-data="{ foo() { ... }">
    <button @click="foo()"></button>
</div>
```

This means that you will now have to manually pass in the `$event` magic if you need access to it from a function:

```html
<div x-data="{ foo(e) { e.preventDefault() }">
    <button @click="foo($event)"></button>
</div>
```

## Returning `false` from event handlers no longer implicitly "preventDefault"s

Currently, Alpine observers a return value of `false` as a desire to run `preventDefault` on the event. This conforms to the standard behavior of native, inline listeners: `<... oninput="someFunctionThatReturnsFalse()">`. Alpine V3 is no longer "return value aware" of event handlers.

```html
<!-- Before -->
<div x-data="{ blockInput() { return false }">
    <input type="text" @input="blockInput()">
</div>

<!-- After -->
<div x-data="{ blockInput(e) { e.preventDefault() }">
    <input type="text" @input="blockInput($event)">
</div>
```

## Binding classes with array syntax `[]` is no longer supported

```html
<!-- Before -->
<div :class="['foo', 'bar']"></div>

<!-- After -->
<div :class="['foo', 'bar'].join(' ')"></div>
```

## `x-show.transition` is now `x-transition`

```html
<!-- Before -->
<div x-show.transition="open"></div>
<!-- After -->
<div x-show="open" x-transition></div>

<!-- Before -->
<div x-show.transition.duration.500ms="open"></div>
<!-- After -->
<div x-show="open" x-transition.duration.500ms></div>

<!-- Before -->
<div x-show.transition.in.duration.500ms.out.duration.750ms="open"></div>
<!-- After -->
<div
    x-show="open"
    x-transition:enter.duration.500ms
    x-transition:leave.duration.750ms
></div>
```

## `x-spread` is now `x-bind`

One of Alpine's stories for re-using functionality is abstracting Alpine directives into objects and applying them to elements with `x-spread`. This behavior is still the same, except now `x-bind` is the API instead of `x-spread`.

```html
<!-- Before -->
<div x-data="dropdown()">
    <button x-spread="trigger">Toggle</button>

    <div x-spread="dialogue">...</div>
</div>

<!-- After -->
<div x-data="dropdown()">
    <button x-bind="trigger">Toggle</button>

    <div x-bind="dialogue">...</div>
</div>


<script>
    function dropdown() {
        return {
            open: false,

            trigger: {
                'x-on:click'() { this.open = ! this.open },
            },

            dialogue: {
                'x-show'() { return this.open },
                'x-bind:class'() { return 'foo bar' },
            },
        }
    }
</script>
```

## Use global events instead of `Alpine.deferLoadingAlpine()`

```html
<!-- Before -->
<script>
    window.deferLoadingAlpine = startAlpine => {
        // Will be executed before initializing Alpine.

        startAlpine()

        // Will be executed after initializing Alpine.
    }
</script>

<!-- After -->
<script>
    document.addEventListener('alpine:initializing', () => {
        // Will be executed before initializing Alpine.
    })

    document.addEventListener('alpine:initialized', () => {
        // Will be executed after initializing Alpine.
    })
</script>
```

## IE11 no longer supported

Alpine will no longer officially support Internet Explorer 11.
