import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 博客部署在 nginx 的 /blog/ 子路径下，所有资源按此 base 解析
export default defineConfig({
  plugins: [vue()],
  base: '/blog/',
})
