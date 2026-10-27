<script setup>
import { ref, computed } from 'vue'
import { articles } from '../data/articles.js'
import BlogHeader from '../components/BlogHeader.vue'
import SearchBox from '../components/SearchBox.vue'
import ArticleCard from '../components/ArticleCard.vue'
import BlogFooter from '../components/BlogFooter.vue'

const keyword = ref('')
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return articles
  return articles.filter((a) =>
    (a.title + ' ' + a.excerpt + ' ' + a.tags.join(' ')).toLowerCase().includes(kw)
  )
})
</script>

<template>
  <div class="container container--wide">
    <BlogHeader />
    <SearchBox v-model="keyword" />
    <div class="no-result" v-show="filtered.length === 0">😿 没有找到相关文章，换个关键词试试 nya~</div>
    <ArticleCard v-for="a in filtered" :key="a.slug" :article="a" />
    <BlogFooter text="🐾 Powered by nginx + 静态页面 · 无后端无数据库，就是这么轻 ~ 🐾" />
  </div>
</template>
