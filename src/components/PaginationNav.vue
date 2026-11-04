<script setup>
// 分页条：上一页 / 页码 / 下一页
// 页数多时中间折成省略号（1 … 4 5 6 … 12），避免页码把一行撑爆
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
const emit = defineEmits(['update:page'])

const items = computed(() => {
  const total = props.totalPages
  const cur = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, cur, cur - 1, cur + 1])
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out = []
  let prev = 0
  for (const n of nums) {
    if (prev && n - prev > 1) out.push('...')
    out.push(n)
    prev = n
  }
  return out
})

function go(p) {
  if (p < 1 || p > props.totalPages || p === props.page) return
  emit('update:page', p)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="分页导航">
    <button
      class="page-btn page-arrow"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="go(page - 1)"
    >←</button>
    <template v-for="(item, i) in items" :key="item === '...' ? 'gap' + i : item">
      <span v-if="item === '...'" class="page-gap">…</span>
      <button
        v-else
        class="page-btn"
        :class="{ active: item === page }"
        :aria-current="item === page ? 'page' : undefined"
        @click="go(item)"
      >{{ item }}</button>
    </template>
    <button
      class="page-btn page-arrow"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="go(page + 1)"
    >→</button>
  </nav>
</template>
