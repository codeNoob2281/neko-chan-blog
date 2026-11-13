<script setup>
// 页脚：两处复用，文案可传
defineProps({ text: { type: String, default: '🐋 Powered by nginx + 静态页面 ~ 🐋' } })
</script>

<template>
  <div class="footer">{{ text }}</div>
</template>
