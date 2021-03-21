import {  } from '../../utils'

test('x-morph',
    `

    `,
    get => {
        get('span').should(beHidden())

    }
)
