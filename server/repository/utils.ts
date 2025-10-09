import { EXPIRES_AT_ATTRIBUTE } from './groups.js'
import type { AttributeRow } from './types.js'

export interface Attributes {
  owner: string[]
  invite: string[]
  admin: string[]
  [EXPIRES_AT_ATTRIBUTE]: string
  tos: string
  extras: {
    [name: string]: string[]
  }
}
export function mergeUniqueGroupAttributes(rows: AttributeRow[]): Attributes {
  const attributes: Attributes = {
    owner: [],
    invite: [],
    admin: [],
    [EXPIRES_AT_ATTRIBUTE]: '',
    tos: '',
    extras: {},
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
  // make unique
  attributes[EXPIRES_AT_ATTRIBUTE] = attributes.extras[EXPIRES_AT_ATTRIBUTE]?.[0] ?? ''
  delete attributes.extras[EXPIRES_AT_ATTRIBUTE]
  attributes.tos = attributes.extras.tos?.[0] ?? ''
  delete attributes.extras.tos

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
