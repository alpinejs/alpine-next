import { test } from '../../utils'

test('works',
    `
        <div x-data="{ foo: 'bar' }" x-on:custom-event="foo = $event.detail.newValue">
            <span x-text="foo"></span>

            <button x-on:click="$dispatch('custom-event', {newValue: 'baz'})">click me</button>
        </div>
    `,
    () => {
        cy.get('span').should('have.text', 'bar')
        cy.get('button').click()
        cy.get('span').should('have.text', 'baz')
    }
)
