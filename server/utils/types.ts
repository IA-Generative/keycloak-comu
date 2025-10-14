type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }
export type XOR<T, U>
  = T extends object
    ? U extends object
      ? (Without<T, U> & U) | (Without<U, T> & T)
      : U : T

export type SchemaObject = Exclude<Exclude<Exclude<Exclude<Parameters<typeof defineRouteMeta>[0]['openAPI'], undefined>['$global'], undefined>['components'], undefined>['schemas'], undefined>[string]
