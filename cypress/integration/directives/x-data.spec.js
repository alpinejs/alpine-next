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
    () => {
        cy.get('h1').should('have.text', 'bar')
        cy.get('h2').should('have.text', 'bob')
        cy.get('h3').should('have.text', 'bar')
        cy.get('h4').should('have.text', 'baz')

        cy.get('button#inner').click()
        cy.get('h1').should('have.text', 'bob')
        cy.get('h2').should('have.text', 'lob')
        cy.get('h3').should('have.text', 'bob')
        cy.get('h4').should('have.text', 'baz')

        cy.get('button#outer').click()
        cy.get('h1').should('have.text', 'law')
        cy.get('h2').should('have.text', 'lob')
        cy.get('h3').should('have.text', 'law')
        cy.get('h4').should('have.text', 'blog')
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
