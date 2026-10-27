import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

// 页面标识由预渲染脚本注入的 window.__PAGE__ 提供（无则为列表页）
createApp(App, { slug: window.__PAGE__?.slug ?? null }).mount('#app')
