// Markdown → HTML：marked + highlight.js 语法高亮 + 代码块语言角标
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import yaml from 'highlight.js/lib/languages/yaml'
import markdownLang from 'highlight.js/lib/languages/markdown'
import diff from 'highlight.js/lib/languages/diff'

const languages = {
  javascript,
  typescript,
  bash,
  python,
  java,
  json,
  xml,
  css,
  sql,
  go,
  rust,
  yaml,
  markdown: markdownLang,
  diff,
}
for (const [name, fn] of Object.entries(languages)) {
  hljs.registerLanguage(name, fn)
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      try {
        return hljs.highlight(code, { language }).value
      } catch {
        return escapeHtml(code)
      }
    },
  })
)

// —— 标题锚点：给每个标题生成稳定 slug id，供目录导航和站外锚点链接用 ——
// 只保留字母/数字/汉字/空格/连字符，中文标题也能得到可读 id；重复标题追加 -1/-2
// headingCounts 在每次 renderMarkdown 开始时重置，保证同内容永远得到同 id（SSR 与客户端一致）
let headingCounts = new Map()

function slugifyHeading(text, counts) {
  let s = text.toLowerCase().replace(/<[^>]+>/g, '').trim()
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
  if (!s) s = 'section'
  const n = (counts.get(s) || 0) + 1
  counts.set(s, n)
  return n > 1 ? `${s}-${n - 1}` : s
}

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      const id = slugifyHeading(text, headingCounts)
      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    },
  },
})

// marked 输出 <pre><code class="hljs language-js">…，给 pre 补 data-lang，CSS 据此渲染左上角语言角标
export function renderMarkdown(md) {
  headingCounts = new Map()
  const html = marked.parse(md)
  return html.replace(
    /<pre><code class="hljs language-([\w-]+)">/g,
    '<pre data-lang="$1"><code class="hljs language-$1">'
  )
}
