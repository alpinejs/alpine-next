import { haveText, test } from '../../utils'

test('sets text on init',
    `
        <div x-data="{ foo: 'bar' }" x-init="foo = 'baz'">
            <span x-text="foo"></span>
        </div>
    `,
    ({ get }) => get('span').should(haveText('baz'))
)


test('x-init can be used outside of x-data',
    `
        <div x-init="$el.textContent = 'foo'"></div>
    `,
    ({ get }) => get('div').should(haveText('foo'))
)


test('changes made in x-init happen before the rest of the component',
    `
        <div x-data="{ foo: 'bar' }" x-init="$refs.foo.innerText = 'yo'">
            <span x-text="foo" x-ref="foo">baz</span>
        </div>
    `,
    ({ get }) => get('span').should(haveText('bar'))
)

test('can make deferred changes with $nextTick',
    `
        <div x-data="{ foo: 'bar' }" x-init="$nextTick(() => $refs.foo.innerText = 'yo')">
            <span x-text="foo" x-ref="foo">baz</span>
        </div>
    `,
    ({ get }) => get('span').should(haveText('yo'))
)
