
it('sets text on init', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-text')

    cy.get('tr:nth-child(1) span').should('contain', 'bar')
})

it('sets text on update', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-text')

    cy.get('tr:nth-child(2) span').should('not.contain', 'bar')
    cy.get('tr:nth-child(2) button').click()
    cy.get('tr:nth-child(2) span').should('contain', 'bar')
})

it('sets text on SVG elements', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-text')

    cy.get('tr:nth-child(3) svg text').should('contain', 'bar')
})
