import Vue from 'vue'
import Router from 'vue-router'
import MainView from '../views/WelcomeView.vue'
import InspireView from '../views/InspireView.vue'
//import Hello from '../components/Hello.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', component: MainView },
    { path: '/inspire', component: InspireView }
  ]
})