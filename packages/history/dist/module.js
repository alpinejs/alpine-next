// packages/shared/src/index.js
function alpineGlobal() {
  if (isBuildingForCdn()) {
    return window.Alpine;
  } else {
    return import("alpinejs");
  }
}
function isBuildingForCdn() {
  if (typeof CDN === "boolean")
    return CDN;
  return false;
}

// packages/history/src/index.js
function src_default(el, {expression}) {
  let getValue = alpineGlobal().evaluateLater(el, expression);
  track(expression, (setMeta) => {
    setMeta("foo", "bar");
    let result;
    getValue((value) => result = value);
    return result;
  }, (value, getMeta) => {
    alpineGlobal().evaluate(el, `${expression} = value`, {scope: {value}});
  });
}
function track(key, getter, setter) {
  let url = new URL(window.location.href);
  if (url.searchParams.has(key)) {
    setter(url.searchParams.get(key), () => {
    });
  }
  let pause = false;
  let firstTime = true;
  window.effect(() => {
    let meta = {};
    let setMeta = (key2, value2) => meta[key2] = value2;
    let value = getter(setMeta);
    if (pause)
      return;
    let object = {value, meta};
    let url2 = new URL(window.location.href);
    url2.searchParams.set(key, value);
    if (firstTime) {
      replace(url2.toString(), key, object);
    } else {
      push(url2.toString(), key, object);
    }
    firstTime = false;
  });
  window.addEventListener("popstate", (e) => {
    if (!e.state)
      return;
    if (!e.state.alpine)
      return;
    Object.entries(e.state.alpine).forEach(([newKey, {value, meta}]) => {
      if (newKey !== key)
        return;
      pause = true;
      let getMeta = (key2) => meta[key2];
      setter(value, getMeta);
      pause = false;
    });
  });
}
function replace(url, key, object) {
  let state = history.state || {};
  if (!state.alpine)
    state.alpine = {};
  state.alpine[key] = object;
  history.replaceState(state, "", url);
}
function push(url, key, object) {
  let state = {alpine: {...history.state.alpine, ...{[key]: object}}};
  history.pushState(state, "", url);
}

// packages/history/builds/module.js
var module_default = src_default;
export {
  module_default as default
};
