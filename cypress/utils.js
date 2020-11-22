export function test(name, template, callback) {
    it(name, () => {
        cy.visit('http://alpine-next.test/cypress/spec.html')

        cy.get('#root').then(([el]) => {
            el.innerHTML = template

            el.evalScripts()

            el.startAlpine()

            callback()
        })
    })
}

export let haveData = (key, value) => ([ el ]) => expect(el._x_root()._x_$data[key]).to.equal(value)

export let beMissingAttribute = attr => el => expect(el).not.to.have.attr(attr)
