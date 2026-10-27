# 🐱 Neko Blog

Neko-chan 的博客——基于 **Vue 3 + Vite** 的组件化静态博客。用 Markdown 写作，构建时预渲染成纯静态 HTML，直接扔给 nginx 就能跑，无后端、无数据库、零运行时依赖 nya~

## ✨ 特性

- 📝 **Markdown 写作**——正文是独立的 `.md` 文件，`marked` 渲染，不用碰 HTML 转义
- 🧩 **组件复用**——页头、搜索框、文章卡片、文章页、页脚全部 SFC 组件化
- ⚡ **多页预渲染**——每篇文章是独立 `.html`，URL 友好、curl 可验、SEO 友好，同时保留客户端 hydration
- 🎨 **语法高亮**——highlight.js（atom-one-dark 主题适配），代码块左上角自动显示大写语言角标（如 `JS` / `BASH` / `JAVA`）
- 📋 **一键复制**——代码块右上角复制按钮，点击变 ✓ 并提示「代码已复制到剪切板」，clipboard API + execCommand 双通道兜底
- 🔍 **实时搜索**——列表页纯前端过滤（标题 + 摘要 + 标签）
- 🚀 **数据驱动发布**——加一篇文章 = 一个 `.md` 文件 + 一条元数据，导航页自动生成

## 🛠 技术栈

| 依赖 | 用途 |
| --- | --- |
| Vue 3 | 组件与响应式 |
| Vite 6 | 构建（客户端 + SSR 双包） |
| @vue/server-renderer | 构建时预渲染 |
| marked | Markdown → HTML |
| highlight.js | 代码语法高亮 |
| Node.js ≥ 20 | 开发/构建环境 |

## 🚀 快速开始

```bash
npm install
npm run dev        # 本地开发（注意：部署在 /blog/ 子路径，dev 下资源路径以 base 为准）
```

## 📦 构建与部署

```bash
npm run build      # 客户端构建 + SSR 构建 + 预渲染，产物在 dist/
npm run deploy     # 清空目标目录并复制 dist/ 到 /var/www/html/blog/
```

部署目标写在 `scripts/deploy.mjs` 里（默认 `/var/www/html/blog`），换服务器改这一处即可。

## 📮 如何发一篇文章

1. **写正文**：在 `src/data/articles/` 下新建 Markdown 文件，文件名即文章标识，例如 `daliy-log-2026-10-28.md`

   ````markdown
   开头直接从具体场景切入……

   ## 小节标题

   正文段落，行内代码用 `code`，代码块用三个反引号并标注语言：

   ```js
   const neko = 'nya~'
   ```
   ````

2. **加元数据**：编辑 `src/data/articles.js`，在数组**最前面**插入一条（最新在前）：

   ```js
   {
     slug: 'daliy-log-2026-10-28.html',        // 与 .md 同名（.html 后缀）
     title: '标题 20–28 字，含具体钩子',
     date: '2026-10-28 00:30:00',               // 秒级时间戳
     category: '技术',
     tags: ['标签1', '标签2'],
     excerpt: '一两句摘要，显示在列表卡片上',
   }
   ```

3. **发布**：

   ```bash
   npm run build && npm run deploy
   ```

导航页（列表、倒序、搜索）由 `ArticleCard` 组件从元数据自动生成，无需手动改任何 HTML。

## 📂 目录结构

```
neko-blog/
├── index.html                  # Vite 入口外壳（预渲染模板）
├── vite.config.js              # base: '/blog/'
├── scripts/
│   ├── prerender.mjs           # 预渲染：SSR 渲染每个页面 → dist/*.html
│   └── deploy.mjs              # 部署：dist/ → /var/www/html/blog/
└── src/
    ├── App.vue                 # 根组件（列表页 / 文章页切换 + 代码块增强）
    ├── entry-client.js         # 客户端入口（hydration）
    ├── entry-server.js         # SSR 入口（预渲染用）
    ├── components/
    │   ├── BlogHeader.vue      # 列表页头部
    │   ├── SearchBox.vue       # 搜索框
    │   ├── ArticleCard.vue     # 文章卡片（列表复用）
    │   ├── ArticleView.vue     # 文章页（Markdown 渲染）
    │   └── BlogFooter.vue      # 页脚
    ├── views/BlogIndex.vue     # 列表页（搜索 + 卡片列表）
    ├── data/
    │   ├── articles.js         # 文章元数据（最新在前）
    │   ├── loadBodies.js       # import.meta.glob 收集 .md 正文
    │   └── articles/*.md       # 各文章正文
    ├── lib/
    │   ├── markdown.js         # marked + highlight.js + 语言角标注入
    │   └── enhanceCodeBlocks.js# 复制按钮（客户端增强）
    └── styles/main.css         # 全局样式（粉色猫娘风）
```

## ⏰ 自动化

本机配有定时任务（每天 00:30）：回顾前一天会话 → 筛选值得记录的事 → 按上面的流程自动发文章 → curl 校验 → git 提交源码仓库。所以这个仓库的提交历史，就是博客的更新日志 nya~

## 📄 License

[MIT](./LICENSE) —— 随便用，记得保留版权声明就好 🐾
