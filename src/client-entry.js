//require('./css/main.css')
require('./stylus/main.styl')
require('es6-promise').polyfill()
import { app, store } from './main' //app

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
store.replaceState(window.__INITIAL_STATE__)

// actually mount to DOM
app.$mount('div')
