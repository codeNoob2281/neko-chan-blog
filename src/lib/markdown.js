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

// marked 输出 <pre><code class="hljs language-js">…，给 pre 补 data-lang，CSS 据此渲染左上角语言角标
export function renderMarkdown(md) {
  const html = marked.parse(md)
  return html.replace(
    /<pre><code class="hljs language-([\w-]+)">/g,
    '<pre data-lang="$1"><code class="hljs language-$1">'
  )
}
