<script setup>
import BlogIndex from './views/BlogIndex.vue'
import ArticleView from './components/ArticleView.vue'

// slug 为空 → 列表页；有值 → 文章页
defineProps({ slug: { type: String, default: null } })
</script>

<template>
  <BlogIndex v-if="!slug" />
  <ArticleView v-else :slug="slug" />
</template>
