// 构建时把 articles/ 下所有 .md 正文内联进来，按 slug 取用
const modules = import.meta.glob('./articles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function getBody(slug) {
  // slug 形如 hello-world.html → ./articles/hello-world.md
  const key = `./articles/${slug.replace(/\.html$/, '')}.md`
  return modules[key] || ''
}
