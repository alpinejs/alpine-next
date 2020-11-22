import { test } from '../../utils'

test('x-data attribute value is optional',
    `
    <div x-data>
        <span x-text="'foo'"></span>
    </div>
    `,
    () => {
        cy.get('span').should('have.text', 'foo')
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
    () => {
        cy.get('span').should('have.text', 'bar')
    }
)

test('x-data can use $el',
    `
    <div x-data="{ text: $el.dataset.text }" data-text="test">
        <span x-text="text"></span>
    </div>
    `,
    () => {
        cy.get('span').should('have.text', 'test')
    }
)

test('functions in x-data are reactive',
    `
    <div x-data="{ foo: 'bar', getFoo() {return this.foo}}">
        <span x-text="getFoo()"></span>
        <button x-on:click="foo = 'baz'">click me</button>
    </div>
    `,
    () => {
        cy.get('span').should('have.text', 'bar')
        cy.get('button').click()
        cy.get('span').should('have.text', 'baz')
    }
)
