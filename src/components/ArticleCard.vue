<script setup>
// 文章卡片：列表页复用组件
defineProps({ article: { type: Object, required: true } })
</script>

<template>
  <a class="post-card" :href="'/blog/' + article.slug" :data-tags="article.tags.join(' ')">
    <h2>{{ article.title }}</h2>
    <div class="meta">发布于 {{ article.date }} · {{ article.category }}</div>
    <div class="excerpt">{{ article.excerpt }}</div>
    <span class="read-more">阅读全文 →</span>
  </a>
</template>
