import { createError as _createError } from 'h3'
import type { ErrorMessageKeys } from '~~/shared/types/index.js'

type ErrorOptions = Exclude<Parameters<typeof _createError>[0], string> & {
  data: ErrorMessageKeys
}

const config = useRuntimeConfig()
export default function createResponseError(options: ErrorOptions) {
  return _createError({
    ...options,
    stack: !config.isProd ? options.stack : undefined, // Hide stack trace in production
  })
}
