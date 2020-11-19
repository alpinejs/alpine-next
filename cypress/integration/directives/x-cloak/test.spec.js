
it('x-cloak is removed', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-cloak')

    let beMissingAttribute = attr => el => expect(el).not.to.have.attr(attr)

    cy.get('span').should(beMissingAttribute('x-cloak'))
})
