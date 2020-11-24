import { haveText, test } from '../../utils'

test('x-data attribute value is optional',
    `
        <div x-data>
            <span x-text="'foo'"></span>
        </div>
    `,
    get => {
        get('span').should(haveText('foo'))
    }
)

test('x-data can be nested',
    `
        <div x-data="{ foo: 'bar', bar: 'baz' }">
            <div x-data="{ bar: 'bob' }">
                <h1 x-text="foo"></h1>
                <h2 x-text="bar"></h2>
                <button id="inner" @click="foo = 'bob'; bar = 'lob'">click</button>
            </div>

            <h3 x-text="foo"></h3>
            <h4 x-text="bar"></h4>
            <button id="outer" @click="foo = 'law'; bar = 'blog'">click</button>
        </div>
    `,
    get => {
        get('h1').should(haveText('bar'))
        get('h2').should(haveText('bob'))
        get('h3').should(haveText('bar'))
        get('h4').should(haveText('baz'))

        get('button#inner').click()
        get('h1').should(haveText('bob'))
        get('h2').should(haveText('lob'))
        get('h3').should(haveText('bob'))
        get('h4').should(haveText('baz'))

        get('button#outer').click()
        get('h1').should(haveText('law'))
        get('h2').should(haveText('lob'))
        get('h3').should(haveText('law'))
        get('h4').should(haveText('blog'))
    }
)

test('x-data can use attributes from a reusable function',
    `
        <script>
            window.test = () => {
                return {
                    foo: 'bar'
                }
            }
        </script>
        <div x-data="test()">
            <span x-text="foo"></span>
        </div>
    `,
    get => {
        get('span').should(haveText('bar'))
    }
)

test('x-data can use $el',
    `
        <div x-data="{ text: $el.dataset.text }" data-text="test">
            <span x-text="text"></span>
        </div>
    `,
    get => {
        get('span').should(haveText('test'))
    }
)

test('functions in x-data are reactive',
    `
        <div x-data="{ foo: 'bar', getFoo() {return this.foo}}">
            <span x-text="getFoo()"></span>
            <button x-on:click="foo = 'baz'">click me</button>
        </div>
    `,
    get => {
        get('span').should(haveText('bar'))
        get('button').click()
        get('span').should(haveText('baz'))
    }
)
