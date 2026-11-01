<script setup>
// 文章卡片：列表页复用组件
// 新版布局：分类徽章 + 时间（顶行）→ 标题 → 摘要（限行）→ 标签 chips + 阅读全文（底行）
import { computed } from 'vue'

const props = defineProps({
  article: { type: Object, required: true },
  latest: { type: Boolean, default: false }, // 列表第一篇且无搜索词时显示「最新」角标
})

// 分类徽章配色：没见过的分类走默认粉
const catClass = computed(
  () => ({ 技术: 'cat-tech', 随笔: 'cat-essay', 日常: 'cat-daily' })[props.article.category] || 'cat-default'
)
// 卡片上只显示到分钟（秒级时间戳在文章页 meta 里保留）
const shortDate = computed(() => props.article.date.slice(0, 16))
// tags[0] 恒等于分类，展示时剔除避免重复；最多露 4 个，其余折成 +N
const shownTags = computed(() => props.article.tags.filter((t) => t !== props.article.category).slice(0, 4))
const extraTags = computed(() => Math.max(0, props.article.tags.filter((t) => t !== props.article.category).length - 4))
</script>

<template>
  <a class="post-card" :href="'/blog/' + article.slug" :data-tags="article.tags.join(' ')">
    <div class="card-top">
      <span v-if="latest" class="latest-badge">🐾 最新</span>
      <span class="cat-pill" :class="catClass">{{ article.category }}</span>
      <time class="post-date" :datetime="article.date">{{ shortDate }}</time>
    </div>
    <h2>{{ article.title }}</h2>
    <p class="excerpt">{{ article.excerpt }}</p>
    <div class="card-foot">
      <span class="tags">
        <span class="tag-chip" v-for="t in shownTags" :key="t">#{{ t }}</span>
        <span v-if="extraTags > 0" class="tag-more">+{{ extraTags }}</span>
      </span>
      <span class="read-more">阅读全文 <span class="arrow">→</span></span>
    </div>
  </a>
</template>
