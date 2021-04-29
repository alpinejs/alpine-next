import { haveText, test } from '../utils'

test('can morph',
    [`
        <div x-data="{ frames: [] }" x-init="$refs.target.innerHTML">
            <template x-ref="first">
                <h1>foo</h1>
            </template>

            <template x-ref="second">
                <h1>bar</h1>
            </template>

            <article x-morph="html" x-ref="target"></article>
        </div>
    `],
    ({ get }) => {
        get('span').should(haveText('1'))
        url().should('include', '?count=1')
        get('button').click()
        get('span').should(haveText('2'))
        url().should('include', '?count=2')
        go('back')
        get('span').should(haveText('1'))
        url().should('include', '?count=1')
        go('forward')
        get('span').should(haveText('2'))
        url().should('include', '?count=2')
    },
)
