
it('sets attribute bindings on initialize', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(1) span').should(el => {
        expect(el).to.have.attr('foo', 'bar')
    })
})

it('class attribute bindings are merged by string syntax', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(2) span').should('have.class', 'foo')
    cy.get('tr:nth-child(2) span').should('not.have.class', 'bar')
    cy.get('tr:nth-child(2) button').click()
    cy.get('tr:nth-child(2) span').should('have.class', 'foo')
    cy.get('tr:nth-child(2) span').should('have.class', 'bar')
})

it('class attribute bindings are added by string syntax', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(3) span').should('have.class', 'foo')
})

it('non-boolean attributes set to null/undefined/false are removed from the element', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let beMissingHref = el => expect(el).not.to.have.attr('href')
    let beMissingVisible = el => expect(el).not.to.have.attr('visible')

    cy.get('tr:nth-child(4) a:nth-child(1)').should(beMissingHref)
    cy.get('tr:nth-child(4) a:nth-child(2)').should(beMissingHref)
    cy.get('tr:nth-child(4) a:nth-child(3)').should(beMissingHref)
    cy.get('tr:nth-child(4) span:nth-child(1)').should(beMissingVisible)
    cy.get('tr:nth-child(4) span:nth-child(2)').should(beMissingVisible)
    cy.get('tr:nth-child(4) span:nth-child(3)').should(beMissingVisible)
})

it('non-boolean empty string attributes are not removed', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveEmptyHref = el => expect(el).to.have.attr('href', '')

    cy.get('tr:nth-child(5) a').should(haveEmptyHref)
})

it('boolean attribute values are set to their attribute name if true and removed if false', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveAttrNameAndValue = attr => el => expect(el).to.have.attr(attr, attr)
    let beMissingAttribute = attr => el => expect(el).not.to.have.attr(attr)

    cy.get('tr:nth-child(6) input:nth-of-type(1)').should(haveAttrNameAndValue('disabled'))
    cy.get('tr:nth-child(6) input:nth-of-type(2)').should(haveAttrNameAndValue('checked'))
    cy.get('tr:nth-child(6) input:nth-of-type(3)').should(haveAttrNameAndValue('required'))
    cy.get('tr:nth-child(6) input:nth-of-type(4)').should(haveAttrNameAndValue('readonly'))
    cy.get('tr:nth-child(6) details').should(haveAttrNameAndValue('open'))
    cy.get('tr:nth-child(6) select').should(haveAttrNameAndValue('multiple'))
    cy.get('tr:nth-child(6) option').should(haveAttrNameAndValue('selected'))
    cy.get('tr:nth-child(6) textarea').should(haveAttrNameAndValue('autofocus'))
    cy.get('tr:nth-child(6) dl').should(haveAttrNameAndValue('itemscope'))
    cy.get('tr:nth-child(6) form').should(haveAttrNameAndValue('novalidate'))
    cy.get('tr:nth-child(6) iframe').should(haveAttrNameAndValue('allowfullscreen'))
    cy.get('tr:nth-child(6) iframe').should(haveAttrNameAndValue('allowpaymentrequest'))
    cy.get('tr:nth-child(6) button').should(haveAttrNameAndValue('formnovalidate'))
    cy.get('tr:nth-child(6) audio').should(haveAttrNameAndValue('autoplay'))
    cy.get('tr:nth-child(6) audio').should(haveAttrNameAndValue('controls'))
    cy.get('tr:nth-child(6) audio').should(haveAttrNameAndValue('loop'))
    cy.get('tr:nth-child(6) audio').should(haveAttrNameAndValue('muted'))
    cy.get('tr:nth-child(6) video').should(haveAttrNameAndValue('playsinline'))
    cy.get('tr:nth-child(6) track').should(haveAttrNameAndValue('default'))
    cy.get('tr:nth-child(6) img').should(haveAttrNameAndValue('ismap'))
    cy.get('tr:nth-child(6) ol').should(haveAttrNameAndValue('reversed'))
    cy.get('tr:nth-child(6) script').should(haveAttrNameAndValue('async'))
    cy.get('tr:nth-child(6) script').should(haveAttrNameAndValue('defer'))
    cy.get('tr:nth-child(6) script').should(haveAttrNameAndValue('nomodule'))

    cy.get('tr:nth-child(6) #setToFalse').click()

    cy.get('tr:nth-child(6) input:nth-of-type(1)').should(beMissingAttribute('disabled'))
    cy.get('tr:nth-child(6) input:nth-of-type(2)').should(beMissingAttribute('checked'))
    cy.get('tr:nth-child(6) input:nth-of-type(3)').should(beMissingAttribute('required'))
    cy.get('tr:nth-child(6) input:nth-of-type(4)').should(beMissingAttribute('readonly'))
    cy.get('tr:nth-child(6) details').should(beMissingAttribute('open'))
    cy.get('tr:nth-child(6) select').should(beMissingAttribute('multiple'))
    cy.get('tr:nth-child(6) option').should(beMissingAttribute('selected'))
    cy.get('tr:nth-child(6) textarea').should(beMissingAttribute('autofocus'))
    cy.get('tr:nth-child(6) dl').should(beMissingAttribute('itemscope'))
    cy.get('tr:nth-child(6) form').should(beMissingAttribute('novalidate'))
    cy.get('tr:nth-child(6) iframe').should(beMissingAttribute('allowfullscreen'))
    cy.get('tr:nth-child(6) iframe').should(beMissingAttribute('allowpaymentrequest'))
    cy.get('tr:nth-child(6) button').should(beMissingAttribute('formnovalidate'))
    cy.get('tr:nth-child(6) audio').should(beMissingAttribute('autoplay'))
    cy.get('tr:nth-child(6) audio').should(beMissingAttribute('controls'))
    cy.get('tr:nth-child(6) audio').should(beMissingAttribute('loop'))
    cy.get('tr:nth-child(6) audio').should(beMissingAttribute('muted'))
    cy.get('tr:nth-child(6) video').should(beMissingAttribute('playsinline'))
    cy.get('tr:nth-child(6) track').should(beMissingAttribute('default'))
    cy.get('tr:nth-child(6) img').should(beMissingAttribute('ismap'))
    cy.get('tr:nth-child(6) ol').should(beMissingAttribute('reversed'))
    cy.get('tr:nth-child(6) script').should(beMissingAttribute('async'))
    cy.get('tr:nth-child(6) script').should(beMissingAttribute('defer'))
    cy.get('tr:nth-child(6) script').should(beMissingAttribute('nomodule'))
})

it('boolean empty string attributes are not removed', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveDisabledAttr = el => expect(el).to.have.attr('disabled', 'disabled')

    cy.get('tr:nth-child(7) input').should(haveDisabledAttr)
})

it('binding supports short syntax', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(8) span').should('have.class', 'bar')
})

it('checkbox is unchecked by default', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(9) input:nth-of-type(1)').should('not.be.checked')
    cy.get('tr:nth-child(9) input:nth-of-type(2)').should('not.be.checked')
    cy.get('tr:nth-child(9) input:nth-of-type(3)').should('not.be.checked')
    cy.get('tr:nth-child(9) input:nth-of-type(4)').should('not.be.checked')
    cy.get('tr:nth-child(9) input:nth-of-type(5)').should('not.be.checked')
})

it('radio is unchecked by default', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    cy.get('tr:nth-child(10) input:nth-of-type(1)').should('not.be.checked')
    cy.get('tr:nth-child(10) input:nth-of-type(2)').should('not.be.checked')
    cy.get('tr:nth-child(10) input:nth-of-type(3)').should('not.be.checked')
    cy.get('tr:nth-child(10) input:nth-of-type(4)').should('not.be.checked')
    cy.get('tr:nth-child(10) input:nth-of-type(5)').should('not.be.checked')
})

it('checkbox values are set correctly', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveValue = value => el => expect(el).to.have.value(value)

    cy.get('tr:nth-child(11) input:nth-of-type(1)').should(haveValue('foo'))
    cy.get('tr:nth-child(11) input:nth-of-type(2)').should(haveValue('on'))
    cy.get('tr:nth-child(11) input:nth-of-type(3)').should(haveValue('on'))
})

it('radio values are set correctly', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveValue = value => el => expect(el).to.have.value(value)
    let beChecked = el => expect(el[0].checked).to.be.true
    let beUnChecked = el => expect(el[0].checked).to.be.false

    cy.get('tr:nth-child(12) #list-1').should(haveValue('1'))
    cy.get('tr:nth-child(12) #list-1').should(beUnChecked)
    cy.get('tr:nth-child(12) #list-8').should(haveValue('8'))
    cy.get('tr:nth-child(12) #list-8').should(beChecked)
    cy.get('tr:nth-child(12) #list-test').should(haveValue('test'))
    cy.get('tr:nth-child(12) #list-test').should(beUnChecked)
})

it('classes are removed before being added', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
    let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

    cy.get('tr:nth-child(13) span').should(haveClasses(['block', 'text-red']))
    cy.get('tr:nth-child(13) button').click()
    cy.get('tr:nth-child(13) span').should(haveClasses(['hidden', 'text-red']))
    cy.get('tr:nth-child(13) span').should(notHaveClasses(['block']))
})

it('extra whitespace in class binding string syntax is ignored', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))

    cy.get('tr:nth-child(14) span').should(haveClasses(['foo', 'bar']))
})

it('undefined class binding resolves to empty string', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveClasses = classes => el => classes.forEach(aClass => expect(el).to.have.class(aClass))
    let notHaveClasses = classes => el => classes.forEach(aClass => expect(el).not.to.have.class(aClass))

    cy.get('tr:nth-child(15) span:nth-of-type(1)').should(haveClasses(['red']))
    cy.get('tr:nth-child(15) span:nth-of-type(2)').should(notHaveClasses(['red']))
})

it('.camel modifier correctly sets name of attribute', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveAttribute = (name, value) => el => expect(el).to.have.attr(name, value)

    cy.get('tr:nth-child(16) svg').should(haveAttribute('viewBox', '0 0 42 42'))
})

it('attribute binding names can contain numbers', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveAttribute = (name, value) => el => expect(el).to.have.attr(name, value)

    cy.get('tr:nth-child(17) line').should(haveAttribute('x2', '3'))
    cy.get('tr:nth-child(17) line').should(haveAttribute('y2', '4'))
})

it('non-string and non-boolean attributes are cast to string when bound to checkbox', () => {
    cy.visit('http://alpine-next.test/cypress/integration/directives/x-bind')

    let haveValue = value => el => expect(el).to.have.value(value)

    cy.get('tr:nth-child(18) input:nth-of-type(1)').should(haveValue('100'))
    cy.get('tr:nth-child(18) input:nth-of-type(2)').should(haveValue('0'))
    cy.get('tr:nth-child(18) input:nth-of-type(3)').should(haveValue('on'))
    cy.get('tr:nth-child(18) input:nth-of-type(4)').should(haveValue('on'))
})
