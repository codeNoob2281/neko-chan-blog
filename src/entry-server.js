import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

// 供 scripts/prerender.mjs 调用：把页面渲染成静态 HTML 字符串
export async function render(slug) {
  const app = createSSRApp(App, { slug })
  return await renderToString(app)
}
