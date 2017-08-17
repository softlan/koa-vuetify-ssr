import Vue from 'vue'
import App from './App.vue'
import store from './store/index'
import router from './router/index'
import { sync } from 'vuex-router-sync'

import Vuetify from 'vuetify'
Vue.use(Vuetify)

sync(store, router)

const app = new Vue({
  router,
  store,
  render: h => h(App)
})

export { app, router, store }
