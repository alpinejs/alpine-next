
it('works', () => {
    cy.visit('http://alpine-next.test/cypress/integration/magics/$el')

    cy.get('tr:nth-child(1) button').should('have.text', 'click me')
    cy.get('tr:nth-child(1) button').click()
    cy.get('tr:nth-child(1) button').should('have.text', 'foo')
})
