
it('sets text on init', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-init')

    cy.get('tr:nth-child(1) span').should('contain', 'baz')
})

it('changes made in x-init happen before the rest of the component', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-init')

    cy.get('tr:nth-child(2) span').should('contain', 'bar')
})

it('can make deferred changes with $nextTick', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-init')

    cy.get('tr:nth-child(3) span').should('contain', 'yo')
})
