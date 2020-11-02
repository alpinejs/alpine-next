export default function(html, callback) {
    cy.visit('http://alpine-next.test/cypress/index.html')

    cy.get('#root').within(($el) => {
        $el.html(html)

        cy.window().then((win) => {
            // call whatever you want on your app's window
            // so your app methods must be exposed somehow
            win.dispatchEvent(new CustomEvent('load-alpine'))

        })

        callback()
    })

}
