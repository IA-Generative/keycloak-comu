import type { AttributeRow } from './types.js'

export interface Attributes {
  // name of the attribute and its values
  [name: string]: string[]
}
export function mergeUniqueGroupAttributes(rows: AttributeRow[]): Attributes {
  const attributes: Record<string, string[]> = {}
  rows.forEach((row) => {
    if (row.name && row.value) {
      if (!attributes[row.name]) {
        attributes[row.name] = []
      }
      attributes[row.name].push(row.value)
    }
  })
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
