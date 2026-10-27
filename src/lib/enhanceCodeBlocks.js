// 代码块复制按钮：v-html 渲染的是静态 HTML，按钮在 hydration 后由客户端增强
// 每个 pre 包一层 .code-block 容器，按钮绝对定位在右上角，避开 pre 的 overflow 裁剪
const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'

export function enhanceCodeBlocks() {
  document.querySelectorAll('.post pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block')) return // 幂等

    // 包容器：按钮和提示气泡挂在这里，不受 pre 的 overflow-x 裁剪
    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'copy-btn'
    btn.setAttribute('aria-label', '复制代码')
    btn.innerHTML = COPY_ICON
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')
      const ok = await copyText(code ? code.innerText : '')
      window.clearTimeout(btn._timer)
      if (ok) {
        btn.classList.remove('failed')
        btn.classList.add('copied')
        btn.innerHTML = CHECK_ICON
      } else {
        btn.classList.remove('copied')
        btn.classList.add('failed')
      }
      btn._timer = window.setTimeout(() => {
        btn.classList.remove('copied', 'failed')
        btn.innerHTML = COPY_ICON
      }, 1600)
    })
    wrapper.appendChild(btn)
  })
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // http 站点没有安全上下文，clipboard API 不可用，退回 execCommand
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
