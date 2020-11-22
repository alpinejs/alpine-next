import { test } from '../../utils'

test('works',
    `
        <div x-data>
            <button @click="$el.innerText = 'foo'">click me</button>
        </div>
    `,
    () => {
        cy.get('button').should('have.text', 'click me')
        cy.get('button').click()
        cy.get('button').should('have.text', 'foo')
    }
)
