
it('works', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(1) span:nth-of-type(1)').should('contain', 'foo')
    cy.get('tr:nth-child(1) span:nth-of-type(2)').should('not.be.visible')
    cy.get('tr:nth-child(1) button').click()
    cy.get('tr:nth-child(1) span:nth-of-type(1)').should('contain', 'foo')
    cy.get('tr:nth-child(1) span:nth-of-type(2)').should('contain', 'bar')
})

it('removes all elements when array is empty and previously had one item', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(2) span').should('be.visible')
    cy.get('tr:nth-child(2) button').click()
    cy.get('tr:nth-child(2) span').should('not.be.visible')
})

it('removes all elements when array is empty and previously had multiple items', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(3) span:nth-of-type(1)').should('be.visible')
    cy.get('tr:nth-child(3) span:nth-of-type(2)').should('be.visible')
    cy.get('tr:nth-child(3) span:nth-of-type(3)').should('be.visible')
    cy.get('tr:nth-child(3) button').click()
    cy.get('tr:nth-child(3) span:nth-of-type(1)').should('not.be.visible')
    cy.get('tr:nth-child(3) span:nth-of-type(2)').should('not.be.visible')
    cy.get('tr:nth-child(3) span:nth-of-type(3)').should('not.be.visible')
})

it('elements inside of loop are reactive', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(4) span').should('be.visible')
    cy.get('tr:nth-child(4) h1').should('contain', 'first')
    cy.get('tr:nth-child(4) h2').should('contain', 'bar')
    cy.get('tr:nth-child(4) button').click()
    cy.get('tr:nth-child(4) span').should('be.visible')
    cy.get('tr:nth-child(4) h1').should('contain', 'first')
    cy.get('tr:nth-child(4) h2').should('contain', 'baz')
})

it('components inside of loop are reactive', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(5) span').should('contain', 'bar')
    cy.get('tr:nth-child(5) button').click()
    cy.get('tr:nth-child(5) span').should('contain', 'bob')
})

it('components inside a plain element of loop are reactive', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(6) span').should('contain', 'bar')
    cy.get('tr:nth-child(6) button').click()
    cy.get('tr:nth-child(6) span').should('contain', 'bob')
})

it('adding key attribute moves dom nodes properly', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    let haveOgIndex = index => el => expect(el[0].og_loop_index).to.equal(index)

    cy.get('tr:nth-child(7) #assign').click()
    cy.get('tr:nth-child(7) span:nth-of-type(1)').should(haveOgIndex(0))
    cy.get('tr:nth-child(7) span:nth-of-type(2)').should(haveOgIndex(1))
    cy.get('tr:nth-child(7) #reorder').click()
    cy.get('tr:nth-child(7) span:nth-of-type(1)').should(haveOgIndex(1))
    cy.get('tr:nth-child(7) span:nth-of-type(2)').should(haveOgIndex(0))
    cy.get('tr:nth-child(7) span:nth-of-type(3)').should(haveOgIndex(undefined))
})

it('can key by index', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    let haveOgIndex = index => el => expect(el[0].og_loop_index).to.equal(index)

    cy.get('tr:nth-child(8) #assign').click()
    cy.get('tr:nth-child(8) span:nth-of-type(1)').should(haveOgIndex(0))
    cy.get('tr:nth-child(8) span:nth-of-type(2)').should(haveOgIndex(1))
    cy.get('tr:nth-child(8) #reorder').click()
    cy.get('tr:nth-child(8) span:nth-of-type(1)').should(haveOgIndex(0))
    cy.get('tr:nth-child(8) span:nth-of-type(2)').should(haveOgIndex(1))
    cy.get('tr:nth-child(8) span:nth-of-type(3)').should(haveOgIndex(undefined))
})

it('can use index inside of loop', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(9) h1').should('contain', 0)
    cy.get('tr:nth-child(9) h2').should('contain', 0)
})

it('can use third iterator param (collection) inside of loop', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(10) h1').should('contain', 'foo')
    cy.get('tr:nth-child(10) h2').should('contain', 'foo')
})

it('listeners in loop get fresh iteration data even though they are only registered initially', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(11) h1').should('contain', '')
    cy.get('tr:nth-child(11) span').click()
    cy.get('tr:nth-child(11) h1').should('contain', 'foo')
    cy.get('tr:nth-child(11) button').click()
    cy.get('tr:nth-child(11) span').click()
    cy.get('tr:nth-child(11) h1').should('contain', 'bar')
})

it('nested x-for', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(12) h1:nth-of-type(1) h2:nth-of-type(1)').should('be.visible')
    cy.get('tr:nth-child(12) h1:nth-of-type(1) h2:nth-of-type(2)').should('be.visible')
    cy.get('tr:nth-child(12) h1:nth-of-type(2) h2:nth-of-type(1)').should('not.be.visible')
    cy.get('tr:nth-child(12) button').click()
    cy.get('tr:nth-child(12) h1:nth-of-type(1) h2:nth-of-type(1)').should('be.visible')
    cy.get('tr:nth-child(12) h1:nth-of-type(1) h2:nth-of-type(2)').should('be.visible')
    cy.get('tr:nth-child(12) h1:nth-of-type(2) h2:nth-of-type(1)').should('be.visible')
})

it('x-for updates the right elements when new item are inserted at the beginning of the list', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(13) span:nth-of-type(1)').should('contain', 'one')
    cy.get('tr:nth-child(13) span:nth-of-type(2)').should('contain', 'two')
    cy.get('tr:nth-child(13) button').click()
    cy.get('tr:nth-child(13) span:nth-of-type(1)').should('contain', 'zero')
    cy.get('tr:nth-child(13) span:nth-of-type(2)').should('contain', 'one')
    cy.get('tr:nth-child(13) span:nth-of-type(3)').should('contain', 'two')
})

it('nested x-for access outer loop variable', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(14) h1:nth-of-type(1) h2:nth-of-type(1)').should('contain', 'foo: bob')
    cy.get('tr:nth-child(14) h1:nth-of-type(1) h2:nth-of-type(2)').should('contain', 'foo: lob')
    cy.get('tr:nth-child(14) h1:nth-of-type(2) h2:nth-of-type(1)').should('contain', 'baz: bab')
    cy.get('tr:nth-child(14) h1:nth-of-type(2) h2:nth-of-type(2)').should('contain', 'baz: lab')
})

it('sibling x-for do not interact with each other', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(15) h1:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) button').click()
    cy.get('tr:nth-child(15) h1:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h1:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) h2:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) h2:nth-of-type(3)').should('contain', '3')
})

it('sibling x-for do not interact with each other', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(15) h1:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) button').click()
    cy.get('tr:nth-child(15) h1:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h1:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) h2:nth-of-type(1)').should('contain', '1')
    cy.get('tr:nth-child(15) h2:nth-of-type(2)').should('contain', '2')
    cy.get('tr:nth-child(15) h2:nth-of-type(3)').should('contain', '3')
})

it('x-for over range using i in x syntax', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(16) span').should('have.length', '10')
})

it('x-for over range using i in property syntax', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(17) span').should('have.length', '10')
})

it('x-for with an array of numbers', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-for')

    cy.get('tr:nth-child(18) span').should('have.length', '0')
    cy.get('tr:nth-child(18) #first').click()
    cy.get('tr:nth-child(18) span').should('have.length', '1')
    cy.get('tr:nth-child(18) #second').click()
    cy.get('tr:nth-child(18) span').should('have.length', '2')
})
