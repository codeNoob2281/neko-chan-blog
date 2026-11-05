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
  // 1) 安全上下文（https / localhost）优先用异步剪贴板 API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* 权限被拒或用户取消，继续走兜底 */
    }
  }

  // 2) textarea + execCommand：http 站点的常规兜底。
  //    只 select() 不 focus() 在部分 WebKit 内核里选不中，必须补 setSelectionRange。
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('aria-hidden', 'true')
    ta.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;' +
      'outline:none;box-shadow:none;background:transparent;opacity:0;'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (ok) return true
  } catch {
    /* 落到下一种方式 */
  }

  // 3) iOS Safari / 部分微信内核：textarea 的 select 不可靠，改用 contentEditable + Range
  try {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    div.setAttribute('aria-hidden', 'true')
    div.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;'
    div.textContent = text
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    div.focus()
    const ok = document.execCommand('copy')
    sel.removeAllRanges()
    document.body.removeChild(div)
    return ok
  } catch {
    return false
  }
}
