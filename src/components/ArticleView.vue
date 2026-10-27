<script setup>
import { computed } from 'vue'
import { articles } from '../data/articles.js'
import { getBody } from '../data/loadBodies.js'
import { renderMarkdown } from '../lib/markdown.js'
import BlogFooter from './BlogFooter.vue'

// 文章页：按 slug 取元数据 + Markdown 正文，marked + highlight.js 渲染
const props = defineProps({ slug: { type: String, required: true } })
const article = articles.find((a) => a.slug === props.slug)
const renderedBody = computed(() =>
  article ? renderMarkdown(getBody(props.slug)) : ''
)
</script>

<template>
  <div class="container" v-if="article">
    <div class="post">
      <a class="back-home" href="/blog/">← 回博客列表</a>
      <h1>{{ article.title }}</h1>
      <div class="meta">{{ article.date }} · {{ article.category }} · Neko-chan</div>
      <div v-html="renderedBody"></div>
    </div>
    <BlogFooter />
  </div>
  <div class="container" v-else>
    <div class="post">
      <a class="back-home" href="/blog/">← 回博客列表</a>
      <h1>😿 文章不存在</h1>
      <p>这只文章猫猫还没写出来，回列表看看别的吧 nya~</p>
    </div>
    <BlogFooter />
  </div>
</template>
