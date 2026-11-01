// 主题切换：深/浅色单例状态
// - 初始值优先级：localStorage 'neko-theme' > 系统 prefers-color-scheme
//   （与 index.html 里的防闪烁内联脚本保持一致，避免 hydration 后跳变）
// - toggle() 写 <html data-theme> 并持久化；用户没显式选过时跟随系统偏好变化
import { ref, watch } from 'vue'

const STORAGE_KEY = 'neko-theme'
const theme = ref('light')
let initialized = false

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    return null // 隐私模式等场景下 localStorage 可能抛错
  }
}

function readInitial() {
  const saved = readSaved()
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  if (!initialized && typeof document !== 'undefined') {
    initialized = true
    theme.value = readInitial()
    // 未显式选择过主题时，系统偏好切换要跟上
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const saved = readSaved()
      if (saved !== 'dark' && saved !== 'light') theme.value = e.matches ? 'dark' : 'light'
    })
  }
  // 主题变化 → 写到 <html data-theme>，CSS 变量整组切换
  watch(theme, (t) => {
    document.documentElement.setAttribute('data-theme', t)
  })
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch (e) {
      /* 存不进去也不影响当前会话 */
    }
  }
  return { theme, toggle }
}
