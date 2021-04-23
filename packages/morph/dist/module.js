// packages/morph/src/index.js
import Alpine from "alpinejs";

// packages/morph/src/morph.js
function morph(dom, toHtml, options) {
  assignOptions(options);
  patch(dom, createElement(toHtml));
  return dom;
}
var key;
var lookahead;
var updating;
var updated;
var removing;
var removed;
var adding;
var added;
var noop = () => {
};
function assignOptions(options = {}) {
  let defaultGetKey = (el) => el.getAttribute("key");
  key = options.key || defaultGetKey;
  lookahead = options.lookahead || false;
  updating = options.updating || noop;
  updated = options.updated || noop;
  removing = options.removing || noop;
  removed = options.removed || noop;
  adding = options.adding || noop;
  added = options.added || noop;
}
function createElement(html) {
  return document.createRange().createContextualFragment(html).firstElementChild;
}
function patch(dom, to) {
  if (dom.isEqualNode(to))
    return;
  if (differentElementNamesTypesOrKeys(dom, to)) {
    return patchElement(dom, to);
  }
  let updateChildrenOnly = false;
  if (shouldSkip(updating, dom, to, () => updateChildrenOnly = true))
    return;
  initializeAlpineOnTo(dom, to, () => updateChildrenOnly = true);
  if (textOrComment(to)) {
    patchNodeValue(dom, to);
    updated(dom, to);
    return;
  }
  if (!updateChildrenOnly) {
    patchAttributes(dom, to);
  }
  updated(dom, to);
  patchChildren(dom, to);
}
function differentElementNamesTypesOrKeys(dom, to) {
  return dom.nodeType != to.nodeType || dom.nodeName != to.nodeName || getKey(dom) != getKey(to);
}
function textOrComment(el) {
  return el.nodeType === 3 || el.nodeType === 8;
}
function patchElement(dom, to) {
  if (shouldSkip(removing, dom))
    return;
  let toCloned = to.cloneNode(true);
  if (shouldSkip(adding, toCloned))
    return;
  dom.parentNode.replaceChild(toCloned, dom);
  removed(dom);
  added(toCloned);
}
function patchNodeValue(dom, to) {
  let value = to.nodeValue;
  if (dom.nodeValue !== value)
    dom.nodeValue = value;
}
function patchAttributes(dom, to) {
  let domAttributes = Array.from(dom.attributes);
  let toAttributes = Array.from(to.attributes);
  for (let i = domAttributes.length - 1; i >= 0; i--) {
    let name = domAttributes[i].name;
    if (!to.hasAttribute(name))
      dom.removeAttribute(name);
  }
  for (let i = toAttributes.length - 1; i >= 0; i--) {
    let name = toAttributes[i].name;
    let value = toAttributes[i].value;
    if (dom.getAttribute(name) !== value)
      dom.setAttribute(name, value);
  }
}
function patchChildren(dom, to) {
  let domChildren = dom.childNodes;
  let toChildren = to.childNodes;
  let toKeyToNodeMap = keyToMap(toChildren);
  let domKeyDomNodeMap = keyToMap(domChildren);
  let currentTo = to.firstChild;
  let currentFrom = dom.firstChild;
  let domKeyHoldovers = {};
  while (currentTo) {
    let toKey = getKey(currentTo);
    let domKey = getKey(currentFrom);
    if (!currentFrom) {
      if (toKey && domKeyHoldovers[toKey]) {
        let holdover = domKeyHoldovers[toKey];
        dom.appendChild(holdover);
        currentFrom = holdover;
      } else {
        addNodeTo(currentTo, dom);
        currentTo = currentTo.nextSibling;
        continue;
      }
    }
    if (lookahead) {
      let nextToElementSibling = currentTo.nextElementSibling;
      if (nextToElementSibling && currentFrom.isEqualNode(nextToElementSibling)) {
        currentFrom = addNodeBefore(currentTo, currentFrom);
        domKey = getKey(currentFrom);
      }
    }
    if (toKey !== domKey) {
      if (!toKey && domKey) {
        domKeyHoldovers[domKey] = currentFrom;
        currentFrom = addNodeBefore(currentTo, currentFrom);
        domKeyHoldovers[domKey].remove();
        currentFrom = currentFrom.nextSibling;
        currentTo = currentTo.nextSibling;
        continue;
      }
      if (toKey && !domKey) {
        if (domKeyDomNodeMap[toKey]) {
          currentFrom.parentElement.replaceChild(domKeyDomNodeMap[toKey], currentFrom);
          currentFrom = domKeyDomNodeMap[toKey];
        }
      }
      if (toKey && domKey) {
        domKeyHoldovers[domKey] = currentFrom;
        let domKeyNode = domKeyDomNodeMap[toKey];
        if (domKeyNode) {
          currentFrom.parentElement.replaceChild(domKeyNode, currentFrom);
          currentFrom = domKeyNode;
        } else {
          domKeyHoldovers[domKey] = currentFrom;
          currentFrom = addNodeBefore(currentTo, currentFrom);
          domKeyHoldovers[domKey].remove();
          currentFrom = currentFrom.nextSibling;
          currentTo = currentTo.nextSibling;
          continue;
        }
      }
    }
    patch(currentFrom, currentTo);
    currentTo = currentTo && currentTo.nextSibling;
    currentFrom = currentFrom && currentFrom.nextSibling;
  }
  while (currentFrom) {
    if (!shouldSkip(removing, currentFrom)) {
      let domForRemoval = currentFrom;
      dom.removeChild(domForRemoval);
      removed(domForRemoval);
    }
    currentFrom = currentFrom.nextSibling;
  }
}
function getKey(el) {
  return el && el.nodeType === 1 && key(el);
}
function keyToMap(els) {
  let map = {};
  els.forEach((el) => {
    let theKey = getKey(el);
    if (theKey) {
      map[theKey] = el;
    }
  });
  return map;
}
function shouldSkip(hook, ...args) {
  let skip = false;
  hook(...args, () => skip = true);
  return skip;
}
function addNodeTo(node, parent) {
  if (!shouldSkip(adding, node)) {
    let clone = node.cloneNode(true);
    parent.appendChild(clone);
    added(clone);
  }
}
function addNodeBefore(node, beforeMe) {
  if (!shouldSkip(adding, node)) {
    let clone = node.cloneNode(true);
    beforeMe.parentElement.insertBefore(clone, beforeMe);
    added(clone);
    return clone;
  }
  return beforeMe;
}
function initializeAlpineOnTo(from, to, childrenOnly) {
  if (from.nodeType !== 1)
    return;
  if (from._x_dataStack) {
    window.Alpine.copyTree(from, to);
  }
  if (Array.from(from.attributes).map((attr) => attr.name).some((name) => /x-show/.test(name))) {
    if (from._x_transitioning) {
      childrenOnly();
    } else {
      if (isHiding(from, to)) {
        let style = to.getAttribute("style");
        to.setAttribute("style", style.replace("display: none;", ""));
      } else if (isShowing(from, to)) {
        to.style.display = from.style.display;
      }
    }
  }
}
function isHiding(from, to) {
  return from._x_is_shown && !to._x_is_shown;
}
function isShowing(from, to) {
  return !from._x_is_shown && to._x_is_shown;
}
function isHiding(from, to) {
  if (beforeAlpineTwoPointSevenPointThree()) {
    return from.style.display === "" && to.style.display === "none";
  }
  return from.__x_is_shown && !to.__x_is_shown;
}
function isShowing(from, to) {
  if (beforeAlpineTwoPointSevenPointThree()) {
    return from.style.display === "none" && to.style.display === "";
  }
  return !from.__x_is_shown && to.__x_is_shown;
}
function beforeAlpineTwoPointSevenPointThree() {
  let [major, minor, patch2] = window.Alpine.version.split(".").map((i) => Number(i));
  return major <= 2 && minor <= 7 && patch2 <= 2;
}

// packages/morph/src/index.js
function src_default(el, {expression}) {
  let evaluate = Alpine.evaluateLater(el, expression);
  window.effect(() => {
    evaluate((value) => {
      if (!el.firstElementChild) {
        if (el.firstChild)
          el.firstChild.remove();
        el.appendChild(document.createElement("div"));
      }
      morph(el.firstElementChild, value);
    });
  });
}

// packages/morph/builds/module.js
var module_default = src_default;
export {
  module_default as default
};
