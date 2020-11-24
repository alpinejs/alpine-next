import { haveText, test } from '../../utils'

test('$watch',
    `
        <div
            x-data="{ foo: 'bar', bob: 'lob' }"
            x-init="$watch('foo', value => { bob = value })"
        >
            <h1 x-text="foo"></h1>
            <h2 x-text="bob"></h2>

            <button x-on:click="foo = 'baz'"></button>
        </div>
    `,
    get => {
        get('h1').should(haveText('bar'))
        get('h2').should(haveText('lob'))
        get('button').click()
        get('h1').should(haveText('baz'))
        get('h2').should(haveText('baz'))
    }
)

test('$watch nested properties',
    `
        <div x-data="{ foo: { bar: 'baz', bob: 'lob' } }" x-init="
            $watch('foo.bar', value => { foo.bob = value });
        ">
            <h1 x-text="foo.bar"></h1>
            <h2 x-text="foo.bob"></h2>

            <button x-on:click="foo.bar = 'law'"></button>
        </div>
    `,
    get => {
        get('h1').should(haveText('baz'))
        get('h2').should(haveText('lob'))
        get('button').click()
        get('h1').should(haveText('law'))
        get('h2').should(haveText('law'))
    }
)

test('$watch arrays',
    `
        <div x-data="{ foo: ['one'], bob: 'lob' }"
            x-init="$watch('foo', value => { bob = value })">
            <h1 x-text="foo"></h1>
            <h2 x-text="bob"></h2>

            <button id="push" x-on:click="foo.push('two')"></button>
            <button id="pop" x-on:click="foo.pop()"></button>
            <button id="unshift" x-on:click="foo.unshift('zero')"></button>
            <button id="shift" x-on:click="foo.shift()"></button>
            <button id="assign" x-on:click="foo = [2,1,3]"></button>
            <button id="sort" x-on:click="foo.sort()"></button>
            <button id="reverse" x-on:click="foo.reverse()"></button>
        </div>
    `,
    get => {
        get('h1').should(haveText('one'))
        get('h2').should(haveText('lob'))

        get('button#push').click()
        get('h1').should(haveText('one,two'))
        get('h2').should(haveText('one,two'))

        get('button#pop').click()
        get('h1').should(haveText('one'))
        get('h2').should(haveText('one'))

        get('button#unshift').click()
        get('h1').should(haveText('zero,one'))
        get('h2').should(haveText('zero,one'))

        get('button#shift').click()
        get('h1').should(haveText('one'))
        get('h2').should(haveText('one'))

        get('button#assign').click()
        get('h1').should(haveText('2,1,3'))
        get('h2').should(haveText('2,1,3'))

        get('button#sort').click()
        get('h1').should(haveText('1,2,3'))
        get('h2').should(haveText('1,2,3'))

        get('button#reverse').click()
        get('h1').should(haveText('3,2,1'))
        get('h2').should(haveText('3,2,1'))
    }
)

test('$watch nested arrays',
    `
        <div x-data="{ foo: {baz: ['one']}, bob: 'lob' }" x-init="$watch('foo.baz', value => { bob = value })">
            <h1 x-text="foo.baz"></h1>
            <h2 x-text="bob"></h2>

            <button id="push" x-on:click="foo.baz.push('two')"></button>
        </div>
    `,
    get => {
        get('h1').should(haveText('one'))
        get('h2').should(haveText('lob'))

        get('button').click()
        get('h1').should(haveText('one,two'))
        get('h2').should(haveText('one,two'))
    }
)
