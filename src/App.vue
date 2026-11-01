<script setup>
import { onMounted } from 'vue'
import BlogIndex from './views/BlogIndex.vue'
import ArticleView from './components/ArticleView.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { enhanceCodeBlocks } from './lib/enhanceCodeBlocks.js'

// slug 为空 → 列表页；有值 → 文章页
defineProps({ slug: { type: String, default: null } })

// 静态产物里的代码块没有交互，hydration 后统一增强（加复制按钮）
onMounted(enhanceCodeBlocks)
</script>

<template>
  <BlogIndex v-if="!slug" />
  <ArticleView v-else :slug="slug" />
  <!-- 全局悬浮主题切换按钮：fixed 定位，每个页面右上角都在 -->
  <ThemeToggle />
</template>
