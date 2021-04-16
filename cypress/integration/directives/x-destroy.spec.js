import { haveText, notBeVisible, test } from '../../utils'

test('callback is triggered when an element is removed from DOM',
    `
        <div x-data="{ foo: 'bar' }">
            <button @click="$el.remove()" x-destroy="foo = 'baz'">Remove Me</button>

            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('button').should(notBeVisible())
        get('span').should(haveText('baz'))
    },
)
