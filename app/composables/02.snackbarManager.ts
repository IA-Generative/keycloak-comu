import type { DsfrAlertType } from '@gouvminint/vue-dsfr'

export interface SnackBarMessage {
  id: string
  text: string
  type: DsfrAlertType
  timeout: number
}

export interface SnackBarMessageParams {
  text: string
  type?: DsfrAlertType
  timeout?: number
}

export const snackbarMessages = ref<Set<SnackBarMessage>>(new Set())

export function addMessage(message: SnackBarMessageParams): string {
  const newMessage: SnackBarMessage = {
    id: crypto.randomUUID(),
    text: message.text,
    type: message.type || 'error',
    timeout: message.timeout || 5000,
  }
  snackbarMessages.value.add(newMessage)
  setTimeout(() => {
    removeMessage(newMessage.id)
  }, newMessage.timeout)
  return newMessage.id
}

export function removeMessage(id: string) {
  const message = Array.from(snackbarMessages.value).find(m => m.id === id)
  if (message) {
    snackbarMessages.value.delete(message)
  }
}
