<script setup>
// 搜索框：v-model 双向绑定关键词
defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="search-box">
    <input
      type="text"
      :value="modelValue"
      placeholder="🔍 搜索文章标题、摘要或标签…"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>
