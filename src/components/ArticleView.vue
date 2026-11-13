<script setup>
import { computed } from 'vue'
import { articles } from '../data/articles.js'
import { getBody } from '../data/loadBodies.js'
import { renderMarkdown } from '../lib/markdown.js'
import BlogFooter from './BlogFooter.vue'
import BlogSidebar from './BlogSidebar.vue'
import TocNav from './TocNav.vue'
import { readingStats } from '../lib/readingStats.js'

// 文章页：按 slug 取元数据 + Markdown 正文，marked + highlight.js 渲染
const props = defineProps({ slug: { type: String, required: true } })
const article = articles.find((a) => a.slug === props.slug)
const renderedBody = computed(() =>
  article ? renderMarkdown(getBody(props.slug)) : ''
)
// 字数与预计阅读时间：和正文同源（同一份 Markdown），预渲染时一并烘进静态 HTML
const stats = computed(() => readingStats(article ? getBody(props.slug) : ''))
</script>

<template>
  <div class="container container--article" v-if="article">
    <BlogSidebar />
    <div class="post">
      <a class="back-home" href="/blog/">← 回博客列表</a>
      <h1>{{ article.title }}</h1>
      <div class="meta">
        <span>{{ article.date }}</span>
        <span>{{ article.category }}</span>
        <span>📝 {{ stats.chars.toLocaleString() }} 字</span>
        <span>⏱️ 约 {{ stats.minutes }} 分钟</span>
        <span>鲸鱼娘</span>
      </div>
      <div v-html="renderedBody"></div>
    </div>
    <!-- 目录导航：PC 常驻右侧（sticky），手机悬浮按钮开合，只在文章页出现 -->
    <TocNav :rendered-body="renderedBody" />
    <BlogFooter />
  </div>
  <div class="container" v-else>
    <div class="post">
      <a class="back-home" href="/blog/">← 回博客列表</a>
      <h1>🌊 文章不存在</h1>
      <p>这篇还没浮上来，回列表看看别的吧。</p>
    </div>
    <BlogFooter />
  </div>
</template>
