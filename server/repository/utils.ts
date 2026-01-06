import type { AttributeRow } from './types.js'

export interface Attributes {
  link: string[]
  owner: string[]
  invite: string[]
  request: string[]
  admin: string[]
  tos: string
  extras: {
    [name: string]: string[]
  }
}
export function mergeUniqueGroupAttributes(rows: AttributeRow[]): Attributes {
  const attributes: Attributes = {
    link: [],
    owner: [],
    invite: [],
    request: [],
    admin: [],
    extras: {},
    tos: '',
  }
  rows.forEach((row) => {
    if (row.name && row.value) {
      if (!attributes.extras[row.name]) {
        attributes.extras[row.name] = []
      }
      attributes.extras[row.name].push(row.value)
    }
  })

  // special keys
  attributes.owner = attributes.extras.owner ?? []
  delete attributes.extras.owner
  attributes.invite = attributes.extras.invite ?? []
  delete attributes.extras.invite
  attributes.admin = attributes.extras.admin ?? []
  delete attributes.extras.admin

  attributes.tos = attributes.extras.tos?.[0] ?? ''
  delete attributes.extras.tos

  attributes.link = attributes.extras.link ?? []
  delete attributes.extras.link

  return attributes
}

export interface MultiGroupAttributes {
  // groupId and its attributes
  [groupId: string]: Record<string, string[]>
}
export function mergeMultipleGroupAttributes(rows: AttributeRow[]): MultiGroupAttributes {
  const attributes: MultiGroupAttributes = {}
  rows.forEach((row) => {
    if (row.name && row.value && row.group_id) {
      if (!attributes[row.group_id]) {
        attributes[row.group_id] = {}
      }
      if (!attributes[row.group_id][row.name]) {
        attributes[row.group_id][row.name] = []
      }
      attributes[row.group_id][row.name].push(row.value)
    }
  })
  return attributes
}

export const bts = (v: boolean) => v ? 'true' : 'false'
export function stb(v?: string | undefined) {
  return v === 'true'
    ? true
    : v === 'false' ? false : null
}

const runtimeConfig = useRuntimeConfig()
export const realmName = runtimeConfig.public.keycloak.realm
