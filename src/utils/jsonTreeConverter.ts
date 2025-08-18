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
    const t = this.valueType(v)
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
    const t = this.valueType(value)

    const node: JsonTreeNode = {
      id,
      key,
      vtype: t,
      raw: value,
      name: '',
      itemStyle: {
        color: this.colorForType(t),
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
      },
      label: { color: '#1f2937', fontSize: 12 },
    }

    if (t === 'object') {
      const c = Object.keys(value).length
      node.name = `${this.keyBadge(key)} ${this.typeBadge('{' + c + '}')}`
    } else if (t === 'array') {
      node.name = `${this.keyBadge(key)} ${this.typeBadge('[' + value.length + ']')}`
    } else {
      node.name = `${this.keyBadge(key)}: ${this.valBadge(value)}`
    }

    if (t === 'object') {
      const entries = Object.entries(value)
      const primitiveObject: any = {}
      const nonPrimitiveChildren: JsonTreeNode[] = []
      entries.forEach(([k, v]) => {
        const vt = this.valueType(v)
        if (vt === 'object' || vt === 'array') {
          nonPrimitiveChildren.push(this.convertJsonToTreeData(v, k, `${path}.${k}`))
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
          name: primitiveKeys.map((k) => `${this.keyBadge(k)}: ${this.valBadge(primitiveObject[k])}`).join('\n'),
          itemStyle: { color: this.colorForType('group'), borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 },
          label: { color: '#1f2937', fontSize: 12 },
        })
      }
      children.push(...nonPrimitiveChildren)
      if (children.length > 0) node.children = children
    } else if (t === 'array') {
      const primitiveArray: any[] = []
      const complexChildren: JsonTreeNode[] = []
      value.forEach((v: any, i: number) => {
        const vt = this.valueType(v)
        if (vt === 'object' || vt === 'array') {
          complexChildren.push(this.convertJsonToTreeData(v, String(i), `${path}.${i}`))
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
          name: primitiveArray.map((p) => `${this.keyBadge(String(p.index))}: ${this.valBadge(p.value)}`).join('\n'),
          itemStyle: { color: this.colorForType('group'), borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 },
          label: { color: '#1f2937', fontSize: 12 },
        })
      }
      children.push(...complexChildren)
      if (children.length > 0) node.children = children
    }

    return node
  }
}
