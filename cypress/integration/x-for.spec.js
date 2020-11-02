import inject from '../inject.js'

it('can render loops', () => {
    inject(`
        <div x-data="{ things: ['foo', 'bar', 'baz'] }">
            <template x-for="(thing, index) in things" :key="index">
                <h1 x-text="thing"></h1>
            </template>
        </div>
    `, () => {
        let assertions = ['foo', 'bar', 'baz']

        cy.get('h1').each(($el, index) => {
            cy.wrap($el).should('have.text', assertions[index])
        })
    })
})
