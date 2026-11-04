// 阅读统计：从 Markdown 原文估算「字数」和「预计阅读时间」，纯函数无副作用
// 字数口径：中文字符（含中文标点）按 1 字计，连续的英文/数字串按 1 词计（≈1 字当量）；
// markdown 语法噪音（标题井号、列表标记、行内符号、图片链接 URL、围栏标记行）剔除，
// 围栏里的代码内容按普通文本保留——技术文里代码也是要读的内容。
// 阅读速度按中文 400 字/分钟（hexo/语雀常用口径），向上取整，最少 1 分钟。

const CJK_RE = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uff00-\uffef]/g
const WORD_RE = /[A-Za-z0-9][A-Za-z0-9_'./-]*/g
const SPEED = 400 // 字/分钟

// 把 markdown 粗略还原成"读者看到的文字"
function plainText(md) {
  return md
    .replace(/^---[\s\S]*?^---\s*/m, ' ') // 容错：万一以后加了 frontmatter
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // ![alt](url) 图片整段剔除
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [文字](url) 链接只留文字
    .replace(/https?:\/\/\S+/g, ' ') // 裸 URL
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ') // 标题井号
    .replace(/^\s{0,3}[-*+]\s+/gm, ' ') // 无序列表标记
    .replace(/^\s{0,3}\d+\.\s+/gm, ' ') // 有序列表标记
    .replace(/^\s{0,3}>\s?/gm, ' ') // 引用符
    .replace(/```[^\n]*/g, ' ') // 围栏标记行（语言名），代码内容保留
    .replace(/[*_~`|]/g, ' ') // 行内标记与表格分隔符
    .replace(/\s*[-=]{3,}\s*/g, ' ') // 分隔线
}

export function readingStats(markdown) {
  if (!markdown) return { chars: 0, minutes: 0 }
  const text = plainText(markdown)
  const cjk = (text.match(CJK_RE) || []).length
  const words = (text.match(WORD_RE) || []).length
  const chars = cjk + words
  const minutes = Math.max(1, Math.ceil(chars / SPEED))
  return { chars, minutes }
}
