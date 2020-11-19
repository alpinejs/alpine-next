
it('can register custom magic properties', () => {
    cy.visit('http://alpine-next.test/cypress/integration/custom-magics.html')

    cy.get('span').should('have.text', 'baz')
})
