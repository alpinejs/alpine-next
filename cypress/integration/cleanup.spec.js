import { haveText, test } from '../utils'

test('element side effects are cleaned up after the elements are removed',
    `
        <div x-data="{ foo: 1, bar: 1 }">
            <button @click="bar++">bar</button>
            <a href="#" @click.prevent="$refs.span.remove()">remove</a>

            <span x-text="(() => { foo = foo + 1; return bar })" x-ref="span"></span>

            <h1 x-text="foo"></h1>
            <h2 x-text="bar"></h2>
        </div>
    `,
    ({ get }) => {
        get('h1').should(haveText('2'))
        get('h2').should(haveText('1'))
        get('button').click()
        get('h1').should(haveText('3'))
        get('h2').should(haveText('2'))
        get('a').click()
        get('button').click()
        get('h1').should(haveText('3'))
        get('h2').should(haveText('3'))
    }
)
