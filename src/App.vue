<script setup>
import { onMounted } from 'vue'
import BlogIndex from './views/BlogIndex.vue'
import ArticleView from './components/ArticleView.vue'
import { enhanceCodeBlocks } from './lib/enhanceCodeBlocks.js'

// slug 为空 → 列表页；有值 → 文章页
defineProps({ slug: { type: String, default: null } })

// 静态产物里的代码块没有交互，hydration 后统一增强（加复制按钮）
onMounted(enhanceCodeBlocks)
</script>

<template>
  <BlogIndex v-if="!slug" />
  <ArticleView v-else :slug="slug" />
</template>
