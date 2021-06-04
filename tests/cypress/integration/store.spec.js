import { haveText, html, test } from '../utils'

test('can register and use a global store',
    [html`
        <div x-data>
            <span x-text="$store.test.foo"></span>
            <button @click="$store.test.foo = 'baz'">clickme</button>
        </div>
    `,
    `
        Alpine.store('test', { foo: 'bar' })
    `],
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)

test('can use primitives as store',
    [html`
        <div x-data>
            <span x-text="$store.test"></span>
            <button @click="$store.test = 'baz'">clickme</button>
        </div>
    `,
    `
        Alpine.store('test', 'bar')
    `],
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
