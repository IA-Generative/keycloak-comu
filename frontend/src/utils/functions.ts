import { addMessage } from "@/composables/snackbarManager"
import type { Ref } from "vue"
import encodeQR from 'qr';

export function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), wait)
  }
}

export function createPublicInviteLink(code: string): string {
  return window.location.origin + '/invite/' + code
}

let resetTimer: ReturnType<typeof setTimeout>

export function copyLink(code: string, reference: Ref<boolean>) {
  const link = createPublicInviteLink(code)
  if (!link) return
  navigator.clipboard.writeText(link).then(() => {
    reference.value = true
    addMessage({ type: 'success', text: 'Lien copié dans le presse-papier.' })
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => { reference.value = false }, 2000)
  })
}

export function generateQRCode(code: string): string {
  const qr = encodeQR(code, 'svg', { scale: 4 })
  return qr
}
