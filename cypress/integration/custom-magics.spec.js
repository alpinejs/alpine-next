import { test } from '../utils'

test('can register custom magic properties',
    `
        <script>
            document.addEventListener('alpine:initializing', () => {
                Alpine.magic('foo', (el) => {
                    return { bar: 'baz' }
                })
            })
        </script>

        <div x-data>
            <span x-text="$foo.bar"></span>
        </div>
    `,
    () => {
        cy.get('span').should('have.text', 'baz')
    }
)
