export interface JsonTreeNode {
  id: string
  key: string
  vtype: string
  raw: any
  name: string
  children?: JsonTreeNode[]
  itemStyle?: any
  label?: any
}

export class JsonTreeConverter {
  private static valueType(v: any): string {
    if (v === null) return 'null'
    if (Array.isArray(v)) return 'array'
    if (typeof v === 'object') return 'object'
    return typeof v
  }

  private static keyBadge(text: string): string {
    return `{key|${text}}`
  }

  private static typeBadge(text: string): string {
    return `{meta|${text}}`
  }

  private static valBadge(v: any): string {
    const t = JsonTreeConverter.valueType(v)
    if (t === 'string') return `{string|"${v}"}`
    if (t === 'number') return `{number|${String(v)}}`
    if (t === 'boolean') return `{boolean|${String(v)}}`
    if (t === 'null') return `{null|null}`
    if (t === 'undefined') return `{null|undefined}`
    if (t === 'array') return `{meta|Array[${v.length}]}`
    if (t === 'object') return `{meta|Object{${Object.keys(v).length}}}`
    return `{meta|${String(v)}}`
  }

  private static colorForType(t: string): string {
    switch (t) {
      case 'object':
        return '#eef2ff'
      case 'array':
        return '#e0f2fe'
      case 'string':
        return '#ecfccb'
      case 'number':
        return '#fef3c7'
      case 'boolean':
        return '#dcfce7'
      case 'null':
        return '#f1f5f9'
      case 'group':
        return '#e7f3ff'
      default:
        return '#ffffff'
    }
  }

  static convertJsonToTreeData(value: any, key: string = 'root', path: string = ''): JsonTreeNode {
    const id = path || key
    const t = JsonTreeConverter.valueType(value)

    const node: JsonTreeNode = {
      id,
      key,
      vtype: t,
      raw: value,
      name: '',
      itemStyle: {
        color: JsonTreeConverter.colorForType(t),
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
      },
      label: {},
    }

    if (t === 'object') {
      const c = Object.keys(value).length
      node.name = `${JsonTreeConverter.keyBadge(key)} ${JsonTreeConverter.typeBadge('{' + c + '}')}`
    } else if (t === 'array') {
      node.name = `${JsonTreeConverter.keyBadge(key)} ${JsonTreeConverter.typeBadge('[' + value.length + ']')}`
    } else {
      node.name = `${JsonTreeConverter.keyBadge(key)}: ${JsonTreeConverter.valBadge(value)}`
    }

    if (t === 'object') {
      const entries = Object.entries(value)
      const primitiveObject: any = {}
      const nonPrimitiveChildren: JsonTreeNode[] = []
      const basePath = path || key
      entries.forEach(([k, v]) => {
        const vt = JsonTreeConverter.valueType(v)
        if (vt === 'object' || vt === 'array') {
          nonPrimitiveChildren.push(JsonTreeConverter.convertJsonToTreeData(v, k, `${basePath}.${k}`))
        } else {
          primitiveObject[k] = v
        }
      })
      const children: JsonTreeNode[] = []
      const primitiveKeys = Object.keys(primitiveObject)
      if (primitiveKeys.length > 0) {
        children.push({
          id: path || key,
          key: '(primitives)',
          vtype: 'group',
          raw: primitiveObject,
          name: primitiveKeys
            .map((k) => `${JsonTreeConverter.keyBadge(k)}: ${JsonTreeConverter.valBadge(primitiveObject[k])}`)
            .join('\n'),
          itemStyle: {
            color: JsonTreeConverter.colorForType('group'),
            borderColor: '#cbd5e1',
            borderWidth: 1,
            borderRadius: 8,
          },
          label: {},
        })
      }
      children.push(...nonPrimitiveChildren)
      if (children.length > 0) node.children = children
    } else if (t === 'array') {
      const primitiveArray: any[] = []
      const complexChildren: JsonTreeNode[] = []
      const basePath = path || key
      value.forEach((v: any, i: number) => {
        const vt = JsonTreeConverter.valueType(v)
        if (vt === 'object' || vt === 'array') {
          complexChildren.push(JsonTreeConverter.convertJsonToTreeData(v, String(i), `${basePath}.${i}`))
        } else {
          primitiveArray.push({ index: i, value: v })
        }
      })
      const children: JsonTreeNode[] = []
      if (primitiveArray.length > 0) {
        children.push({
          id: path || key,
          key: '(primitives)',
          vtype: 'group',
          raw: primitiveArray.map((p) => p.value),
          name: primitiveArray
            .map((p) => `${JsonTreeConverter.keyBadge(String(p.index))}: ${JsonTreeConverter.valBadge(p.value)}`)
            .join('\n'),
          itemStyle: {
            color: JsonTreeConverter.colorForType('group'),
            borderColor: '#cbd5e1',
            borderWidth: 1,
            borderRadius: 8,
          },
          label: {},
        })
      }
      children.push(...complexChildren)
      if (children.length > 0) node.children = children
    }

    return node
  }
}
