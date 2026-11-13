<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { articles } from '../data/articles.js'
import BlogHeader from '../components/BlogHeader.vue'
import SearchBox from '../components/SearchBox.vue'
import ArticleCard from '../components/ArticleCard.vue'
import PaginationNav from '../components/PaginationNav.vue'
import BlogSidebar from '../components/BlogSidebar.vue'
import BlogFooter from '../components/BlogFooter.vue'

const PAGE_SIZE = 5

const keyword = ref('')
// 分类 / 标签筛选（空串 = 不筛）
const activeCategory = ref('')
const activeTag = ref('')

// 三维过滤：分类 AND 标签 AND 关键词
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return articles.filter((a) => {
    if (activeCategory.value && a.category !== activeCategory.value) return false
    if (activeTag.value && !a.tags.includes(activeTag.value)) return false
    if (!kw) return true
    return (a.title + ' ' + a.excerpt + ' ' + a.tags.join(' ')).toLowerCase().includes(kw)
  })
})

const hasFilter = computed(() => !!(keyword.value.trim() || activeCategory.value || activeTag.value))

const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

// 打开页面时从 URL 恢复筛选，分享链接 / 刷新都保留状态
onMounted(() => {
  const p = new URLSearchParams(window.location.search)
  activeCategory.value = p.get('cat') || ''
  activeTag.value = p.get('tag') || ''
  keyword.value = p.get('q') || ''
})

// 筛选状态同步回地址栏（不刷新页面，也不产生历史记录）
function syncUrl() {
  const p = new URLSearchParams()
  if (activeCategory.value) p.set('cat', activeCategory.value)
  if (activeTag.value) p.set('tag', activeTag.value)
  if (keyword.value.trim()) p.set('q', keyword.value.trim())
  const qs = p.toString()
  history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

// 换关键词/筛选都从第一页看起；结果变少导致当前页越界时回退到最后一页
watch([keyword, activeCategory, activeTag], () => {
  page.value = 1
  syncUrl()
})
watch(totalPages, (n) => { if (page.value > n) page.value = n })

// 侧栏点分类/标签：组件内切换，再点一次取消（不整页刷新）
function onPick({ type, value }) {
  if (type === 'cat') activeCategory.value = activeCategory.value === value ? '' : value
  else activeTag.value = activeTag.value === value ? '' : value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearFilters() {
  keyword.value = ''
  activeCategory.value = ''
  activeTag.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function changePage(p) {
  page.value = p
  // 翻页后回到列表顶部，别让人停在页脚
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="container container--wide container--side">
    <BlogHeader />
    <BlogSidebar
      interactive
      :active-category="activeCategory"
      :active-tag="activeTag"
      @pick="onPick"
    />
    <div class="side-main">
    <SearchBox v-model="keyword" />
    <!-- 列表状态行：无筛选时显示总数，有筛选时显示命中数并提供清空 -->
    <div class="list-status">
      <span v-if="!hasFilter">🐾 共 {{ articles.length }} 篇文章，按发布时间倒序 · 第 {{ page }}/{{ totalPages }} 页</span>
      <span v-else>🔍 筛选命中 <b>{{ filtered.length }}</b> 篇 · 第 {{ page }}/{{ totalPages }} 页</span>
      <button v-if="hasFilter" class="clear-kw" @click="clearFilters">清空 ×</button>
    </div>
    <!-- 当前筛选条件做成可摘除的小胶囊 -->
    <div class="filter-chips" v-if="hasFilter">
      <a v-if="activeCategory" class="filter-chip" href="/blog/" @click.prevent="activeCategory = ''">🗂️ {{ activeCategory }} ×</a>
      <a v-if="activeTag" class="filter-chip" href="/blog/" @click.prevent="activeTag = ''">🏷️ {{ activeTag }} ×</a>
      <a v-if="keyword.trim()" class="filter-chip" href="/blog/" @click.prevent="keyword = ''">🔍 {{ keyword.trim() }} ×</a>
    </div>
    <div class="no-result" v-show="filtered.length === 0">🌊 没有找到相关文章，换个关键词试试</div>
    <ArticleCard
      v-for="(a, index) in paged"
      :key="a.slug"
      :article="a"
      :latest="!keyword.trim() && page === 1 && index === 0"
    />
    <PaginationNav :page="page" :total-pages="totalPages" @update:page="changePage" />
    </div>
    <BlogFooter text="🐋 Powered by nginx + 静态页面 · 无后端无数据库，就是这么轻 ~ 🐋" />
  </div>
</template>
