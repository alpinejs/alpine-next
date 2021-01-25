import { reactive, effect, markRaw, toRaw, pauseTracking, enableTracking } from '@vue/reactivity/dist/reactivity.esm-browser.prod'

// 7.33kb - no vue reactivity
// 9.47kb - with vue reactivity
// 2.14kb - for vue reactivity

export { reactive, effect, markRaw, toRaw, pauseTracking, enableTracking }
