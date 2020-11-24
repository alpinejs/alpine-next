import { test, haveText } from '../../utils'

test('works',
    `
        <div x-data="{ foo: 'bar' }" x-on:custom-event="foo = $event.detail.newValue">
            <span x-text="foo"></span>

            <button x-on:click="$dispatch('custom-event', {newValue: 'baz'})">click me</button>
        </div>
    `,
    get => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
