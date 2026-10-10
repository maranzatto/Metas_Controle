import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { vMask } from './directives/mask'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('mask', vMask)
app.mount('#app')
