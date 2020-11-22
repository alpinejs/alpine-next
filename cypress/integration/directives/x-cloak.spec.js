import { test, beMissingAttribute } from '../../utils'

test('x-cloak is removed',
    `
    <div x-data="{ hidden: true }">
        <span x-cloak></span>
    </div>
    `,
    () => {
        cy.get('span').should(beMissingAttribute('x-cloak'))
    }
)
