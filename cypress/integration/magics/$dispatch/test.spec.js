
it('works', () => {
    cy.visit('http://alpine-next.test/cypress/integration/magics/$dispatch')

    cy.get('span').should('have.text', 'bar')
    cy.get('button').click()
    cy.get('span').should('have.text', 'baz')
})
