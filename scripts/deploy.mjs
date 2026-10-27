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
