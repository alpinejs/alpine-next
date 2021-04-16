import { haveText, test } from '../../utils'

test('can reference elements from event listeners',
    `
        <div x-data="{}">
            <button x-on:click="$refs['bob'].textContent = 'lob'"></button>

            <span x-ref="bob"></span>
        </div>
    `,
    ({ get }) => {
        get('button').click()
        get('span').should(haveText('lob'))
    }
)

test('can reference elements from data object methods',
    `
        <div x-data="{ foo() { this.$refs.bob.textContent = 'lob' } }">
            <button x-on:click="foo()"></button>

            <span x-ref="bob"></span>
        </div>
    `,
    ({ get }) => {
        get('button').click()
        get('span').should(haveText('lob'))
    }
)

test('can reference elements from x-init',
    `
        <div x-data x-init="$refs.foo.textContent = 'lob'">
            <span x-ref="foo">bob</span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('lob'))
    }
)
