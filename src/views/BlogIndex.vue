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
    <!-- 列表状态行：无搜索词时显示总数，搜索时显示命中数并提供清空 -->
    <div class="list-status">
      <span v-if="!keyword.trim()">🐾 共 {{ articles.length }} 篇文章，按发布时间倒序</span>
      <span v-else>🔍 找到 <b>{{ filtered.length }}</b> 篇与「{{ keyword.trim() }}」相关的文章</span>
      <button v-if="keyword.trim()" class="clear-kw" @click="keyword = ''">清空 ×</button>
    </div>
    <div class="no-result" v-show="filtered.length === 0">😿 没有找到相关文章，换个关键词试试 nya~</div>
    <ArticleCard v-for="(a, index) in filtered" :key="a.slug" :article="a" :latest="!keyword.trim() && index === 0" />
    <BlogFooter text="🐾 Powered by nginx + 静态页面 · 无后端无数据库，就是这么轻 ~ 🐾" />
  </div>
</template>
