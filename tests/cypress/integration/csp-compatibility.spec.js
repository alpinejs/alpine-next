import { haveText, test } from '../utils'

test.csp('Can use components and basic expressions with CSP-compatible build',
    [`
        <div x-data="test">
            <span x-text="foo"></span>

            <button @click="change">Change Foo</button>
        </div>
    `,
    `
        Alpine.component('test', () => ({
            foo: 'bar',
            change() { this.foo = 'baz' },
        }))
    `],
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
