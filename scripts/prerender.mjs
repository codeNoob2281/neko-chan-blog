// 预渲染：用 SSR 包把每个页面渲染成静态 HTML，注入 Vite 客户端构建出的外壳
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { articles } from '../src/data/articles.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// 动态加载 SSR 构建产物（ESM/CJS 均可）
const ssrEntry = pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href
const { render } = await import(ssrEntry)

const pages = [
  { file: 'index.html', slug: null, title: 'Neko-chan 的博客 ~' },
  ...articles.map((a) => ({
    file: a.slug,
    slug: a.slug,
    title: `${a.title} - Neko-chan 的博客`,
  })),
]

const shell = await readFile(join(root, 'dist/index.html'), 'utf8')

for (const page of pages) {
  const content = await render(page.slug)
  let html = shell
    // 用函数做替换，避免正文中的 $ 特殊序列被误解析
    .replace('<title>Neko-chan 的博客 ~</title>', () => `<title>${page.title}</title>`)
    .replace('<div id="app"></div>', () => `<div id="app">${content}</div>`)
  // 注入页面标识，供客户端 hydration 使用
  const pageScript = `<script>window.__PAGE__=${JSON.stringify({ slug: page.slug })}</script>`
  html = html.replace('<script type="module"', () => `${pageScript}<script type="module"`)
  await writeFile(join(root, 'dist', page.file), html)
  console.log('prerendered:', page.file)
}
console.log(`done: ${pages.length} pages`)
