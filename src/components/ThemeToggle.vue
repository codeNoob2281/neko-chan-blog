<script setup>
// 全局主题切换按钮：固定在视口右上角，挂载在 App.vue 上，所有页面通用
// 浅色（白天）= 猫猫醒着 🐱；深色（晚上）= 猫猫睡觉 🐱💤
// 注：Unicode 没有单只「睡觉猫」emoji，用猫 + Zzz 组合表达
import { useTheme } from '../lib/useTheme.js'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :title="theme === 'dark' ? '切换到浅色模式（叫醒猫猫）' : '切换到深色模式（猫猫要睡觉了）'"
    :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggle"
  >
    <span class="cat-emoji" aria-hidden="true">{{ theme === 'dark' ? '🐱💤' : '🐱' }}</span>
  </button>
</template>
