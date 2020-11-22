import { test, haveData } from '../../utils'

test('The name of the test',
    `<h1 x-data x-text="'HEY'"></h1>`,
    () => cy.get('h1').should('have.text', 'HEY')
)

test('x-model has value binding when initialized',
    `
    <div x-data="{ foo: 'bar' }">
        <input x-model="foo"></input>
    </div>
    `,
    () => {
        cy.get('input').should('have.value', 'bar')
    }
)

test('x-model updates value when updated via input event',
    `
    <div x-data="{ foo: 'bar' }">
        <input x-model="foo"></input>
        <span x-text="foo"></span>
    </div>
    `,
    () => {
        cy.get('span').should('have.text', 'bar')
        cy.get('input').type('baz')
        cy.get('span').should('have.text', 'barbaz')
    }
)

test('x-model has value binding when updated',
    `
    <div x-data="{ foo: 'bar' }">
        <input x-model="foo"></input>

        <button x-on:click="foo = 'baz'">click me</button>
    </div>
    `,
    () => {
        cy.get('input').should('have.value', 'bar')
        cy.get('button').click()
        cy.get('input').should('have.value', 'baz')
    }
)

test('x-model casts value to number if number modifier is present',
    `
    <div x-data="{ foo: null }">
        <input type="number" x-model.number="foo"></input>
    </div>
    `,
    () => {
        cy.get('input').type('123')
        cy.get('div').should(haveData('foo', 123))

    }
)

test('x-model with number modifier returns: null if empty, original value if casting fails, numeric value if casting passes',
    `
    <div x-data="{ foo: 0, bar: '' }">
        <input type="number" x-model.number="foo"></input>
        <input x-model.number="bar"></input>
    </div>
    `,
    () => {
        cy.get('input:nth-of-type(1)').clear()
        cy.get('div').should(haveData('foo', null))
        cy.get('input:nth-of-type(1)').clear().type('-')
        cy.get('div').should(haveData('foo', null))
        cy.get('input:nth-of-type(1)').clear().type('-123')
        cy.get('div').should(haveData('foo', -123))
        cy.get('input:nth-of-type(2)').type(123).clear()
        cy.get('div').should(haveData('bar', null))
        cy.get('input:nth-of-type(2)').clear().type('-')
        cy.get('div').should(haveData('bar', '-'))
        cy.get('input:nth-of-type(2)').clear().type('-123')
        cy.get('div').should(haveData('bar', -123))
    }
)

test('x-model trims value if trim modifier is present',
    `
    <div x-data="{ foo: '' }">
        <input x-model.trim="foo"></input>

        <span x-text="foo"></span>
    </div>
    `,
    () => {
        cy.get('input').type('bar     ')
        cy.get('div').should(haveData('foo', 'bar'))
    }
)

// test('x-model updates value when updated via change event when lazy modifier is present',
// `
// <div x-data="{ foo: 'bar' }">
//     <input x-model.lazy="foo"></input>
// </div>
// `,
// () => {
//     let haveData = (key, value) => ([ el ]) => expect(el._x_root()._x_$data[key]).to.equal(value)

//     cy.get('input').type('bar     ')
//     cy.get('div').should(([ el ]) => expect(el._x_$data.foo).to.equal('bar'))
// })
