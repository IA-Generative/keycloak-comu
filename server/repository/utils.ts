import type { AttributeRow } from './types.js'

export interface Attributes {
  owner: string[]
  invite: string[]
  request: string[]
  admin: string[]
  extras: {
    [name: string]: string[]
  }
}
export function mergeUniqueGroupAttributes(rows: AttributeRow[]): Attributes {
  const attributes: Attributes = {
    owner: [],
    invite: [],
    request: [],
    admin: [],
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
