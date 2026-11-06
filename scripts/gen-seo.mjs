// SEO 产物生成：构建时按 src/data/articles.js 自动生成 dist/sitemap.xml 和 dist/robots.txt
// 加文章只需在 articles.js 加一条元数据，重新 build 时 sitemap 自动带出新 URL，无需手改
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { articles } from '../src/data/articles.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// 站点地址：默认本机公网 IP；将来绑域名只需 SITE_URL=https://xxx npm run build（或改这里一行）
const SITE_URL = (process.env.SITE_URL || 'http://62.234.151.56').replace(/\/+$/, '')
const BASE_PATH = '/blog'
const site = (p = '') => `${SITE_URL}${BASE_PATH}/${p}`

// articles.js 里的 date 是北京时间 'YYYY-MM-DD HH:mm:ss'，转成 sitemap 认的 W3C 时间
function toW3C(dateStr) {
  const d = new Date(String(dateStr).replace(' ', 'T') + '+08:00')
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const newest = articles
  .map((a) => toW3C(a.date))
  .filter(Boolean)
  .sort()
  .at(-1)

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const urls = [
  // 列表首页：每次构建都算「刚更新过」
  { loc: site(), lastmod: newest, changefreq: 'daily', priority: '1.0' },
  ...articles.map((a) => ({
    loc: site(a.slug),
    lastmod: toW3C(a.date),
    changefreq: 'monthly',
    priority: '0.8',
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

await writeFile(join(root, 'dist/sitemap.xml'), sitemap)

// robots.txt 必须放在站点根目录才生效（/blog/robots.txt 爬虫不会读），
// 这里生成到 dist/，再由 deploy.mjs 复制到 /var/www/html/robots.txt
const robots = `# 由 scripts/gen-seo.mjs 构建时生成，勿手改
User-agent: *
Allow: /

Sitemap: ${site('sitemap.xml')}
`

await writeFile(join(root, 'dist/robots.txt'), robots)

console.log(`seo: sitemap.xml (${urls.length} urls) + robots.txt, site=${SITE_URL}${BASE_PATH}`)
