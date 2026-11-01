// 部署：清空目标目录旧产物，复制 dist/ 到 nginx 博客目录
import { readdir, rm, cp, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = '/var/www/html/blog'

await mkdir(target, { recursive: true })
for (const f of await readdir(target)) {
  await rm(join(target, f), { recursive: true, force: true })
}
await cp(join(root, 'dist'), target, { recursive: true })
console.log('deployed to', target)

// 主题变量同步到站点根目录：小窝主页（/，手写静态页）通过 /theme-tokens.css 引用同一份，
// 保证主页和博客的深浅色配色永远一致（同源共享 localStorage，选择也互通）
await cp(join(root, 'src/styles/theme-tokens.css'), '/var/www/html/theme-tokens.css')
console.log('theme tokens -> /var/www/html/theme-tokens.css')
