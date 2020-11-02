import inject from '../inject.js'

it('should bind to string literals', () => {
    inject(`<span x-data="{}" x-text="'hey'">yoo</span>`, () => {
        cy.root().should('have.text', 'hey')
    })
})

it('should bind to component data', () => {
    inject(`<span x-data="{ foo: 'bar' }" x-text="foo">yo</span>`, () => {
        cy.root().should('have.text', 'bar')
    })
})
