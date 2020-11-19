
it('x-data attribute value is optional', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-data')

    cy.get('tr:nth-child(1) span').should('have.text', 'foo')
})

it('x-data can use attributes from a reusable function', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-data')

    cy.get('tr:nth-child(2) span').should('have.text', 'bar')
})

it('x-data can use $el', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-data')

    cy.get('tr:nth-child(3) span').should('have.text', 'test')
})

it('functions in x-data are reactive', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-data')

    cy.get('tr:nth-child(4) span').should('have.text', 'bar')
    cy.get('tr:nth-child(4) button').click()
    cy.get('tr:nth-child(4) span').should('have.text', 'baz')
})
