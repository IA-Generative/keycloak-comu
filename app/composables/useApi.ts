// A wrapper around $fetch that supports path parameters like :id
import { addMessage } from '#imports'
import ERROR_MESSAGES from '~~/shared/ErrorMessages.js'

// Usage: await fetcher('/api/v1/groups/:id', { params: { id: '123' } })
function preparedFetch<F extends (...args: any[]) => any>(fn: F): F {
  return ((...args: Parameters<F>): ReturnType<F> => {
    const { $keycloak } = useNuxtApp()

    if (args[1] && typeof args[1] === 'object' && 'params' in args[1]) {
      const params = (args[1] as any).params as Record<string, string>
      for (const key in params) {
        const regex = new RegExp(`(:${key}\/)`, 'g')
        args[0] = (args[0] as string).replace(regex, params[key] as string)
        const regex2 = new RegExp(`(:${key}$)`, 'g')
        args[0] = (args[0] as string).replace(regex2, params[key] as string)
      }
    }

    if ($keycloak?.token) {
      if (!args[1] || typeof args[1] !== 'object') {
        args[1] = {}
      }
      if (!('headers' in args[1])) {
        ; (args[1] as any).headers = {}
      }
      ; (args[1] as any).headers.Authorization = `Bearer ${$keycloak.token}`
    }
    return fn(...args)
      .catch((err: any) => {
        let errorCodes: string[] = []
        try {
          const parsed = JSON.parse(err.data.message)
          if (Array.isArray(parsed)) {
            errorCodes = parsed.map((p: { message: string }) => p.message)
          }
        } catch (_e) {
          // Not JSON, ignore
          errorCodes = ['UNKNOWN_ERROR']
          if (err?.data?.data) {
            errorCodes.push(err.data.data as string)
          }
        }
        for (const errorCode of errorCodes) {
          if (errorCode in ERROR_MESSAGES) {
            const messageLocal = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]
            addMessage({ text: messageLocal.fr, type: 'error' })
            console.error(messageLocal.en)
            continue
          }
          addMessage({ text: err.data.data, type: 'error' })
          console.error(err.data.data)
        }
        return Promise.reject(err)
      })
  }) as F
}

const fetcher = preparedFetch($fetch)

export default fetcher
