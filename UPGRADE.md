## V2 -> V3 Upgrade Guide

# Breaking Changes
* [`x-data` cascading scope](#x-data-cascading-scope)
* [`$el` is no longer the root](#el-is-no-longer-the-root)
* [Automatically evaluate `init()` functions defined on data object](#automatically-evaluate-init-functions-defined-on-data-object)
* [`x-init` no longer accepts a callback return](#x-init-no-longer-accepts-a-callback-return)
* [Returning `false` from event handlers no longer implicitly "preventDefault"s](#returning-false-from-event-handlers-no-longer-implicitly-preventdefaults)
* [`x-show.transition` is now `x-transition`](#x-showtransition-is-now-x-transition)
* [`x-spread` is now `x-bind`](#x-spread-is-now-x-bind)
* [Use global events instead of `Alpine.deferLoadingAlpine()`](#use-global-events-instead-of-alpinedeferloadingalpine)
* [IE11 no longer supported](#ie11-no-longer-supported)
* [`x-html` has been removed](#x-html-has-been-removed)

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

## `x-html` has been removed

# Added
* [Alpine.component](#alpinecomponent)
* [Alpine.magic](#alpinemagic)
* [Alpine.directive](#alpinedirective)
* [Alpine.store && `$store`](#alpinestore--store)
* [Deep async support](#deep-async-support)
* [`.throttle`](#throttle)
* [Support magics in component objects](#support-magics-in-component-objects)
* [alpine:initialized/ing events](#alpineinitializeding-events)
* [`x-destroy`](#x-destroy)
* [`x-init` on any element](#x-init-on-any-element)
* [Support short-circuit evaluation (&& and ||) in class bindings](#support-short-circuit-evaluation--and--in-class-bindings)
* [Support `if ()` as start of x-init and event listeners](#support-if--as-start-of-x-init-and-event-listeners)
* [`x-intersect`](#x-intersect)
* [`x-morph`](#x-morph)
* [Passing HTML validation](#passing-html-validation)

## Alpine.component

Alpine V3 now has an official API for registering Alpine components outside the `x-data` attribute.

```html
<div x-data="dropdown">
    <button @click="toggle()">Toggle</button>

    <div x-show="open">...</div>
</div>

<script>
    Alpine.component('dropdown', () => ({
        open: false,

        toggle() { this.open = ! this.open },
    }))
</script>
```

**Auto-evaluating `init()`**

A common pattern in older versions is manually passing an `init()` function to the `x-init` Livewire directive. V3 now automatically calls a `init()` method if it is found in the component object.

```html
<!-- Before -->
<div x-data="dropdown" x-init="init()">

<!-- After -->
<div x-data="dropdown">

<script>
    Alpine.component('dropdown', () => ({
        init() {
            // Runs when this component is initialized.
        },

        ...
    }))
</script>
```

## Alpine.magic

```html
<!-- Define a custom magic variable -->
<button @click="$current.innerHTML = '...'">...</button>

<script>
    Alpine.magic('current', el => {
        return el
    })
</script>

<!-- Define a custom magic function -->
<button @click="$log('Hello')">...</button>

<script>
    Alpine.magic('log', () => {
        return message => {
            console.log(message)
        }
    })
</script>
```

## Alpine.directive

**Full API**
```html
<div x-foo:bar.baz.bob="lob"></div>

<script>
    Alpine.directive('foo', (el, value, modifiers, expression) => {
        // el: The element the directive is declared on
        // value: "bar"
        // modifiers: ["baz", "bob"]
        // expression: "lob"
    })
</script>
```

## Alpine.store && `$store`

```html
<div x-text="$store('foo').bar"></div>

<script>
    Alpine.store('foo', { bar: 'baz' })
</script>
```

## Deep async support

All Alpine expressions are now evaluated in an `async` context allowing the full use of `await` inside expressions.

```html
<div x-on="console.log(await $fetch('/some-page'))"></div>

<div x-text="await $fetch('/some-page')"></div>

<script>
    function $fetch(url) {
        return new Promise(resolve => {
            fetch(url)
                .then(i => i.text())
                .then(html => resolve(html))
        })
    }
</script>
```

```html
<div x-data="foo">
    <button @click="log()">log</button>
</div>

<script>
    document.addEventListener('alpine:initializing', () => {
        Alpine.component('foo', () => ({
            async log() {
                console.log('hey');
            }
        }))
    })
</script>
```

## `.throttle`

```html
<!-- Will update "foo" every 250ms while a user is typing -->
<input type="text" x-model.throttle="foo">

<!-- Will only run "foo" every 250ms while a user is typing -->
<input type="text" @input.throttle="foo()">

<!-- Will run "foo" every 500ms while a user is typing -->
<input type="text" @input.throttle.500ms="foo()">
```

## Support magics in component objects

```html
<div x-data="foo">
    <button @click="handle()">...</button>
</div>

<script>
    document.addEventListener('alpine:initializing', () => {
        Alpine.component('foo', () => ({
            handle() {
                this.$dispatch('some-event')
            }
        }))
    })
</script>
```

## `alpine:initialized/ing events`

```html
<script>
    document.addEventListener('alpine:initializing', () => {
        // Before Alpine has intialized
    })

    document.addEventListener('alpine:initialized', () => {
        // After Alpine has intialized
    })
</script>
```

## `x-destroy`

```html
<div x-data x-destroy="console.log('removing element...')">...</div>
```

## `x-init` on any element

```html
<div x-data x-init="console.log('inited root...')">
    <span x-init="console.log('inited span...')"></span>
</div>
```

## Support short-circuit evaluation (&& and ||) in class bindings

```html
<!-- Short-circuit if [true] evaluation -->
<div :class="isOpen && 'shadow'">
<!-- Short-circuit if [false] evaluation -->
<div :class="isOpen || 'hidden'">
```

## Support `if ()` as start of x-init and event listeners

```html
<div x-data x-init="if (true) console.log('log me')">
```

## `x-intersect`

```html
<div x-intersect="console.log('this div has been scrolled into or out of the viewport')">

<div x-intersect:leave="console.log('this div has been scrolled out of the viewport')">

<div x-intersect:enter="console.log('this div has been scrolled into of the viewport')">

<div x-intersect.once="console.log('this div has been scrolled into of the viewport')">

<div x-ref="foo"></div>
<div x-intersect.ref.foo="console.log('the $refs.foo div has been scrolled into of the viewport')">
```

## `x-morph`

```html
<div x-morph="someHtml">
    ...
</div>
```

## Passing HTML validation

```html
<div data-x-data="{ hey: 'foo' }">
    <h1 data-x-text="hey">hey</h1>
</div>

<script>
    document.addEventListener('alpine:initializing', () => {
        Alpine.addInitSelector('[data-x-data]')

        Alpine.transformAttribute(attr => {
            attr.name = attr.name.replace('data-', '')

            return attr
        })
    })
</script>
```

# Uncertainties
* Must include `()` in method event handlers
    * Reason for uncertainty: Breaking VueJS convention, and having to manually pass the `$event` variable.
* Binding classes with array syntax `[]` is no longer supported
    * Reason for uncertainty: scared of removing things people use, expect, and like (I might expect, but don't use or like personally)
* `x-spread` is now `x-bind`
