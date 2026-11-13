<script setup>
// 博客侧边栏：文章列表页和详情页左侧通用。
// 四个模块：个人信息 / 公告 / 分类 / 标签云。
// 分类、标签、统计数字全部从 articles.js 自动推导，加文章即自动更新。
// interactive=true（列表页）：点分类/标签就地过滤，再点一次取消，不整页刷新；
// interactive=false（文章页）：点链接跳到 /blog/?cat=... 或 /blog/?tag=... 带筛选进列表。

import { ref, watch, onBeforeUnmount } from 'vue'
import { articles } from '../data/articles.js'

const props = defineProps({
  // 当前激活的筛选（由列表页传入，用于高亮）
  activeCategory: { type: String, default: '' },
  activeTag: { type: String, default: '' },
  // true = 组件内过滤（emit pick），false = 链接跳转
  interactive: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

// ↓↓↓ 数据绑定位置：个人信息，改这里 ↓↓↓
// 格式：{ name: 昵称, avatar: 头像（emoji 或图片 url）, location: 地理位置 }
const profile = {
  name: '鲸鱼娘',
  avatar: '🐋',
  location: '中国 · 云端',
}
// 格式：[{ icon: 图标emoji, title: 悬停提示, url: 链接 }, ...]
const socials = [
  { icon: '🐙', title: 'GitHub', url: 'https://github.com/codeNoob2281' },
  { icon: '🔔', title: '订阅更新（预留）', url: '#' },
  { icon: '✉️', title: '邮箱', url: 'mailto:2281461058@qq.com' },
]
// 公告文案，纯文本
const announcement = '你好呀，欢迎来到鲸鱼娘的博客！这里记录一只深海鲸类的日常与折腾流水账，主食是米饭。'
// ↑↑↑ 数据绑定结束 ↑↑↑

// ---- 以下为自动统计，无需手改 ----
// 文章总数 / 分类数 / 标签数
const articleCount = articles.length
const categoryCount = new Set(articles.map((a) => a.category)).size
const tagCount = new Set(articles.flatMap((a) => a.tags)).size

// 格式：[{ name: 分类名, count: 文章数 }, ...] 按数量降序
const categories = Object.entries(
  articles.reduce((m, a) => ((m[a.category] = (m[a.category] || 0) + 1), m), {})
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)

// 格式：[{ name: 标签名, count: 文章数 }, ...] 按数量降序
// 标签云只展前 tagLimit 个（默认 16），避免文章多了以后侧栏被标签淹没
const tagLimit = 16
const allTags = Object.entries(
  articles.flatMap((a) => a.tags).reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {})
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
const tags = allTags.slice(0, tagLimit)

// 分类/标签的链接：列表页就地过滤，其他页面跳回列表并带上筛选参数
function onPick(type, value, e) {
  if (props.interactive) {
    e.preventDefault()
    emit('pick', { type, value })
  }
}
const catHref = (name) => `/blog/?cat=${encodeURIComponent(name)}`
const tagHref = (name) => `/blog/?tag=${encodeURIComponent(name)}`

// 「更多 >>」弹框：展示全部分类和标签（标签云卡片只显示前 tagLimit 个，这里是全集）
const showModal = ref(false)
function pickFromModal(type, value, e) {
  onPick(type, value, e)
  showModal.value = false
}
// 弹框开着时：Esc 关闭 + 锁住背景滚动
function onEsc(e) { if (e.key === 'Escape') showModal.value = false }
watch(showModal, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onEsc)
  else window.removeEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEsc)
  document.body.style.overflow = ''
})
</script>

<template>
  <aside class="sidebar">
    <!-- 内层 sticky 载体：sticky 放在这层而不是 aside 上。
         aside 作为 grid 项拉伸占满行高后，本层的 sticky 约束区 = aside 盒子，
         滑动到行底就停——不会像直接 sticky 在 aside 上那样（Chromium 把
         约束区算到整个 grid 容器）一路滑下去盖住页脚。 -->
    <div class="sidebar-inner">
    <!-- 模块一：个人信息 -->
    <section class="side-card side-profile">
      <span class="side-avatar" aria-hidden="true">{{ profile.avatar }}</span>
      <div class="side-name">{{ profile.name }}</div>
      <div class="side-loc">📍 {{ profile.location }}</div>
      <div class="side-stats">
        <div class="side-stat"><b>{{ articleCount }}</b><span>文章</span></div>
        <div class="side-stat"><b>{{ categoryCount }}</b><span>分类</span></div>
        <div class="side-stat"><b>{{ tagCount }}</b><span>标签</span></div>
      </div>
      <div class="side-social">
        <a v-for="s in socials" :key="s.title" :href="s.url" :title="s.title" target="_blank" rel="noopener">{{ s.icon }}</a>
      </div>
    </section>

    <!-- 模块二：公告 -->
    <section class="side-card">
      <div class="side-head"><span aria-hidden="true">📢</span><span class="side-title">公告</span></div>
      <p class="side-notice">{{ announcement }}</p>
    </section>

    <!-- 模块三：分类 -->
    <section class="side-card">
      <div class="side-head">
        <span aria-hidden="true">🗂️</span><span class="side-title">分类</span>
        <button class="side-more" type="button" @click="showModal = true">更多 &gt;&gt;</button>
      </div>
      <nav class="side-cats">
        <a
          v-for="c in categories"
          :key="c.name"
          class="side-cat"
          :class="{ active: activeCategory === c.name }"
          :href="catHref(c.name)"
          @click="onPick('cat', c.name, $event)"
        >
          <span>{{ c.name }}</span><span class="count">{{ c.count }}</span>
        </a>
      </nav>
    </section>

    <!-- 模块四：标签云 -->
    <section class="side-card">
      <div class="side-head">
        <span aria-hidden="true">🏷️</span><span class="side-title">标签云</span>
        <button class="side-more" type="button" @click="showModal = true">更多 &gt;&gt;</button>
      </div>
      <div class="tags side-tags">
        <a
          v-for="t in tags"
          :key="t.name"
          class="tag-chip side-tag"
          :class="{ active: activeTag === t.name }"
          :href="tagHref(t.name)"
          @click="onPick('tag', t.name, $event)"
        >
          {{ t.name }}<span class="count">{{ t.count }}</span>
        </a>
      </div>
    </section>
    </div>

    <!-- 「更多 >>」弹框：全部分类 + 全部标签，点一项即筛选并收起（不加过渡动画，切换即时） -->
    <teleport to="body">
      <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
          <div class="modal-card" role="dialog" aria-modal="true" aria-label="全部分类与标签">
            <div class="modal-head">
              <span>🐾 全部分类与标签</span>
              <button class="modal-close" type="button" aria-label="关闭" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="modal-sub">🗂️ 分类（{{ categories.length }}）</div>
              <nav class="side-cats">
                <a
                  v-for="c in categories"
                  :key="'m-' + c.name"
                  class="side-cat"
                  :class="{ active: activeCategory === c.name }"
                  :href="catHref(c.name)"
                  @click="pickFromModal('cat', c.name, $event)"
                >
                  <span>{{ c.name }}</span><span class="count">{{ c.count }}</span>
                </a>
              </nav>
              <div class="modal-sub">🏷️ 标签（{{ allTags.length }}）</div>
              <div class="tags side-tags">
                <a
                  v-for="t in allTags"
                  :key="'m-' + t.name"
                  class="tag-chip side-tag"
                  :class="{ active: activeTag === t.name }"
                  :href="tagHref(t.name)"
                  @click="pickFromModal('tag', t.name, $event)"
                >
                  {{ t.name }}<span class="count">{{ t.count }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
    </teleport>
  </aside>
</template>
