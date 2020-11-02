import inject from '../inject.js'

it('can render two nested components', () => {
    inject(`
        <div x-data="{ foo: 'bar' }">
            <h1 x-text="foo"></h1>

            <div x-data="{ foo: 'baz' }">
                <h2 x-text="foo"></h2>
            </div>
        </div>
    `, () => {
        cy.get('h1').should('have.text', 'bar')
        cy.get('h2').should('have.text', 'baz')
    })
})
