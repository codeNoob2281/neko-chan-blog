<script setup>
// 文章目录导航：右上角悬浮按钮（在主题切换按钮下方），点击展开/收起目录面板
// 目录项从渲染后的 HTML 里提取 h2/h3（id 由 markdown.js 的标题锚点生成），
// 滚动时用 IntersectionObserver 高亮当前小节；仅文章页挂载（ArticleView 内）
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({ renderedBody: { type: String, required: true } })

const open = ref(false)
const activeId = ref('')

// 从预渲染好的 HTML 里抓目录，保证和页面上的标题 id 严格一致
const items = computed(() => {
  const out = []
  const re = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g
  let m
  while ((m = re.exec(props.renderedBody))) {
    const text = m[3]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
    out.push({ depth: Number(m[1]), id: m[2], text })
  }
  return out
})

// 高亮当前小节：取「标题顶部已越过视口 30% 线」的最后一个标题
// 没越过任何标题时不高亮（还没开始读正文）
function computeActiveId() {
  const heads = document.querySelectorAll('.post h2[id], .post h3[id]')
  const line = window.innerHeight * 0.3
  let current = ''
  for (const h of heads) {
    if (h.getBoundingClientRect().top <= line) current = h.id
    else break
  }
  return current
}
function updateActive() {
  activeId.value = computeActiveId()
}

let onScroll = null
let outsideClick = null
onMounted(() => {
  onScroll = updateActive
  updateActive()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  // 点面板外面自动收起
  outsideClick = (e) => {
    if (open.value && !e.target.closest('.toc-nav')) open.value = false
  }
  document.addEventListener('click', outsideClick)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  document.removeEventListener('click', outsideClick)
})

function jump(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 12
  // 尊重系统的「减少动态效果」设置：开了就直跳，不做平滑动画
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  // 立刻同步高亮，不等 scroll 事件（程序化滚动里 scroll 事件时序不可靠）
  updateActive()
  // 更新地址栏 hash，方便把小节链接分享出去
  history.replaceState(null, '', '#' + id)
  // 手机屏幕小，点完目录就收起，别挡正文
  if (window.innerWidth <= 640) open.value = false
}
</script>

<template>
  <aside v-if="items.length" class="toc-nav" :class="{ open }">
    <!-- 手机端：悬浮按钮开合；PC 端由 CSS 隐藏按钮、目录常驻右侧 -->
    <button
      class="toc-btn"
      type="button"
      :class="{ open }"
      :aria-expanded="open"
      aria-controls="toc-panel"
      title="目录导航"
      @click="open = !open"
    >
      <span aria-hidden="true">📑</span>
    </button>
    <nav id="toc-panel" class="toc-panel" :class="{ open }">
      <div class="toc-title">🐾 目录</div>
      <a
        v-for="it in items"
        :key="it.id"
        class="toc-link"
        :class="[`toc-d${it.depth}`, { active: activeId === it.id }]"
        :href="'#' + it.id"
        @click.prevent="jump(it.id)"
      >{{ it.text }}</a>
    </nav>
  </aside>
</template>
