import { beChecked, notBeChecked, haveAttribute, haveData, haveText, test, beVisible, notBeVisible } from '../../utils'

test('data modified in event listener updates affected attribute bindings',
    `
        <div x-data="{ foo: 'bar' }">
            <button x-on:click="foo = 'baz'"></button>

            <span x-bind:foo="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveAttribute('foo', 'bar'))
        get('button').click()
        get('span').should(haveAttribute('foo', 'baz'))
    }
)

test('can call a method without parenthesis',
    `
        <div x-data="{ foo: 'bar', baz($event) { this.foo = $event.target.dataset.bob } }">
            <button x-on:click="baz" data-bob="lob"></button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('lob'))
    }
)

test('nested data modified in event listener updates affected attribute bindings',
    `
        <div x-data="{ nested: { foo: 'bar' } }">
            <button x-on:click="nested.foo = 'baz'"></button>

            <span x-bind:foo="nested.foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveAttribute('foo', 'bar'))
        get('button').click()
        get('span').should(haveAttribute('foo', 'baz'))
    }
)

test('.passive modifier should disable e.preventDefault()',
    `
        <div x-data="{ defaultPrevented: null }">
            <button
                x-on:mousedown.passive="
                    $event.preventDefault();
                    defaultPrevented = $event.defaultPrevented;
                "
            >
                <span></span>
            </button>
        </div>
    `,
    ({ get }) => {
        get('button').click()
        get('div').should(haveData('defaultPrevented', false))
    }
)

test('.stop modifier',
    `
        <div x-data="{ foo: 'bar' }">
            <button x-on:click="foo = 'baz'">
                <h1>h1</h1>
                <h2 @click.stop>h2</h2>
            </button>
        </div>
    `,
    ({ get }) => {
        get('div').should(haveData('foo', 'bar'))
        get('h2').click()
        get('div').should(haveData('foo', 'bar'))
        get('h1').click()
        get('div').should(haveData('foo', 'baz'))
    }
)

test('.self modifier',
    `
        <div x-data="{ foo: 'bar' }">
            <h1 x-on:click.self="foo = 'baz'" id="selfTarget">
                content
                <button>click</button>
                content
            </h1>
            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('bar'))
        get('h1').click()
        get('span').should(haveText('baz'))
    }
)

test('.prevent modifier',
    `
        <div x-data="{}">
            <input type="checkbox" x-on:click.prevent>
        </div>
    `,
    ({ get }) => {
        get('input').check()
        get('input').should(notBeChecked())
    }
)

test('.window modifier',
    `
        <div x-data="{ foo: 'bar' }">
            <div x-on:click.window="foo = 'baz'"></div>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('span').click()
        get('span').should(haveText('baz'))
    }
)

test('expressions can start with if',
    `
        <div x-data="{ foo: 'bar' }">
            <button @click="if (foo === 'bar') foo = 'baz'">click</button>
            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('unbind global event handler when element is removed',
    `
        <div x-data="{ count: 0 }">
            <div x-on:click.window="count++" x-ref="rmMe"></div>

            <button @click="$refs.rmMe.remove()">click</button>
            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('button').click()
        get('span').click()
        get('span').should(haveText('1'))
    }
)

test('.document modifier',
    `
       <div x-data="{ foo: 'bar' }">
            <div x-on:click.document="foo = 'baz'"></div>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('span').click()
        get('span').should(haveText('baz'))
    }
)

test('.once modifier',
    `
        <div x-data="{ count: 0 }">
            <button x-on:click.once="count = count+1"></button>

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('button').click()
        get('span').should(haveText('1'))
        get('button').click()
        get('span').should(haveText('1'))
    }
)

test('.once modifier with @keyup',
    `
        <div x-data="{ count: 0 }">
            <input type="text" x-on:keyup.once="count = count+1">

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('input').type('f')
        get('span').should(haveText('1'))
        get('input').type('o')
        get('span').should(haveText('1'))
    }
)

test('.debounce modifier',
    `
        <div x-data="{ count: 0 }">
            <input x-on:input.debounce="count = count+1">

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('input').type('f')
        get('span').should(haveText('1'))
        get('input').type('ffffffffffff')
        get('span').should(haveText('2'))
    }
)

test('keydown modifiers',
    `
        <div x-data="{ count: 0 }">
            <input type="text"
                x-on:keydown="count++"
                x-on:keydown.enter="count++"
                x-on:keydown.space="count++"
            >

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('input').type('f')
        get('span').should(haveText('1'))
        get('input').type('{enter}')
        get('span').should(haveText('3'))
        get('input').type(' ')
        get('span').should(haveText('5'))
    }
)

test('keydown combo modifiers',
    `
        <div x-data="{ count: 0 }">
            <input type="text" x-on:keydown.cmd.enter="count++">

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('input').type('f')
        get('span').should(haveText('0'))
        get('input').type('{cmd}{enter}')
        get('span').should(haveText('1'))
    }
)

test('keydown with specified key and stop modifier only stops for specified key',
    `
        <div x-data="{ count: 0 }">
            <article x-on:keydown="count++">
                <input type="text" x-on:keydown.enter.stop>
            </article>

            <span x-text="count"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('0'))
        get('input').type('f')
        get('span').should(haveText('1'))
        get('input').type('{enter}')
        get('span').should(haveText('1'))
    }
)

test('@click.away',
    `
        <div x-data="{ foo: 'bar' }">
            <h1 @click.away="foo = 'baz'">h1</h1>

            <h2>h2</h2>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('h1').click()
        get('span').should(haveText('bar'))
        get('h2').click()
        get('span').should(haveText('baz'))
    }
)

test('@click.away with x-show (prevent race condition)',
    `
        <div x-data="{ show: false }">
            <button @click="show = true">Show</button>

            <h1 x-show="show" @click.away="show = false">h1</h1>

            <h2>h2</h2>
        </div>
    `,
    ({ get }) => {
        get('h1').should(notBeVisible())
        get('button').click()
        get('h1').should(beVisible())
    }
)

test('event with colon',
    `
        <div x-data="{ foo: 'bar' }">
            <div x-on:my:event.document="foo = 'baz'"></div>

            <button @click="document.dispatchEvent(new CustomEvent('my:event', { bubbles: true }))">click</button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('event instance can be passed to method reference',
    `
        <div x-data="{ foo: 'bar', changeFoo(e) { this.foo = e.target.id } }">
            <button x-on:click="changeFoo" id="baz"></button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('.camel modifier correctly binds event listener',
    `
        <div x-data="{ foo: 'bar' }" x-on:event-name.camel="foo = 'baz'">
            <button x-on:click="$dispatch('eventName')"></button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('.camel modifier correctly binds event listener with namespace',
    `
        <div x-data="{ foo: 'bar' }" x-on:ns:event-name.camel="foo = 'baz'">
            <button x-on:click="$dispatch('ns:eventName')"></button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
