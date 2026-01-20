import { expect } from 'chai'
import { JsonTreeConverter, JsonTreeNode } from '@/utils/jsonTreeConverter'

describe('JsonTreeConverter', () => {
  describe('convertJsonToTreeData', () => {
    it('should convert primitive values correctly', () => {
      const stringNode = JsonTreeConverter.convertJsonToTreeData('hello', 'greeting')
      expect(stringNode.id).to.equal('greeting')
      expect(stringNode.key).to.equal('greeting')
      expect(stringNode.vtype).to.equal('string')
      expect(stringNode.raw).to.equal('hello')
      expect(stringNode.name).to.equal('{key|greeting}: {string|"hello"}')
      expect(stringNode.children).to.be.undefined

      const numberNode = JsonTreeConverter.convertJsonToTreeData(42, 'age')
      expect(numberNode.vtype).to.equal('number')
      expect(numberNode.name).to.equal('{key|age}: {number|42}')

      const booleanNode = JsonTreeConverter.convertJsonToTreeData(true, 'active')
      expect(booleanNode.vtype).to.equal('boolean')
      expect(booleanNode.name).to.equal('{key|active}: {boolean|true}')

      const nullNode = JsonTreeConverter.convertJsonToTreeData(null, 'empty')
      expect(nullNode.vtype).to.equal('null')
      expect(nullNode.name).to.equal('{key|empty}: {null|null}')
    })

    it('should convert empty array correctly', () => {
      const node = JsonTreeConverter.convertJsonToTreeData([], 'items')
      expect(node.id).to.equal('items')
      expect(node.key).to.equal('items')
      expect(node.vtype).to.equal('array')
      expect(node.raw).to.deep.equal([])
      expect(node.name).to.equal('{key|items} {meta|[0]}')
      expect(node.children).to.be.undefined
    })

    it('should convert empty object correctly', () => {
      const node = JsonTreeConverter.convertJsonToTreeData({}, 'config')
      expect(node.id).to.equal('config')
      expect(node.key).to.equal('config')
      expect(node.vtype).to.equal('object')
      expect(node.raw).to.deep.equal({})
      expect(node.name).to.equal('{key|config} {meta|{0}}')
      expect(node.children).to.be.undefined
    })

    it('should convert array with primitive values correctly', () => {
      const array = [1, 'hello', true, null]
      const node = JsonTreeConverter.convertJsonToTreeData(array, 'mixedArray')

      expect(node.vtype).to.equal('array')
      expect(node.name).to.equal('{key|mixedArray} {meta|[4]}')
      expect(node.children).to.have.lengthOf(1)

      const primitiveGroup = node.children![0]
      expect(primitiveGroup.key).to.equal('(primitives)')
      expect(primitiveGroup.vtype).to.equal('group')
      expect(primitiveGroup.name).to.include('{key|0}: {number|1}')
      expect(primitiveGroup.name).to.include('{key|1}: {string|"hello"}')
      expect(primitiveGroup.name).to.include('{key|2}: {boolean|true}')
      expect(primitiveGroup.name).to.include('{key|3}: {null|null}')
    })

    it('should convert array with complex values correctly', () => {
      const array = [{ name: 'John' }, [1, 2, 3]]
      const node = JsonTreeConverter.convertJsonToTreeData(array, 'complexArray')

      expect(node.vtype).to.equal('array')
      expect(node.children).to.have.lengthOf(2)

      const objectChild = node.children!.find((n) => n.key === '0')
      expect(objectChild).to.exist
      expect(objectChild!.vtype).to.equal('object')
      expect(objectChild!.id).to.equal('complexArray.0')

      const arrayChild = node.children!.find((n) => n.key === '1')
      expect(arrayChild).to.exist
      expect(arrayChild!.vtype).to.equal('array')
      expect(arrayChild!.id).to.equal('complexArray.1')
    })

    it('should convert object with primitive values correctly', () => {
      const obj = {
        name: 'John',
        age: 30,
        active: true,
        data: null,
      }
      const node = JsonTreeConverter.convertJsonToTreeData(obj, 'user')

      expect(node.vtype).to.equal('object')
      expect(node.name).to.equal('{key|user} {meta|{4}}')
      expect(node.children).to.have.lengthOf(1)

      const primitiveGroup = node.children![0]
      expect(primitiveGroup.key).to.equal('(primitives)')
      expect(primitiveGroup.vtype).to.equal('group')
      expect(primitiveGroup.name).to.include('{key|name}: {string|"John"}')
      expect(primitiveGroup.name).to.include('{key|age}: {number|30}')
      expect(primitiveGroup.name).to.include('{key|active}: {boolean|true}')
      expect(primitiveGroup.name).to.include('{key|data}: {null|null}')
    })

    it('should convert object with mixed primitive and complex values correctly', () => {
      const obj = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
        hobbies: ['reading', 'coding'],
      }
      const node = JsonTreeConverter.convertJsonToTreeData(obj, 'profile')

      expect(node.vtype).to.equal('object')
      expect(node.children).to.have.lengthOf(3)

      const primitiveGroup = node.children!.find((n) => n.key === '(primitives)')
      expect(primitiveGroup).to.exist
      expect(primitiveGroup!.name).to.include('{key|name}: {string|"John"}')
      expect(primitiveGroup!.name).to.include('{key|age}: {number|30}')

      const addressNode = node.children!.find((n) => n.key === 'address')
      expect(addressNode).to.exist
      expect(addressNode!.vtype).to.equal('object')
      expect(addressNode!.id).to.equal('profile.address')

      const hobbiesNode = node.children!.find((n) => n.key === 'hobbies')
      expect(hobbiesNode).to.exist
      expect(hobbiesNode!.vtype).to.equal('array')
      expect(hobbiesNode!.id).to.equal('profile.hobbies')
    })

    it('should handle nested structures correctly', () => {
      const complexData = {
        users: [
          {
            id: 1,
            name: 'John',
            tags: ['admin', 'user'],
          },
          {
            id: 2,
            name: 'Jane',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        ],
        config: {
          version: '1.0',
          debug: false,
        },
      }

      const node = JsonTreeConverter.convertJsonToTreeData(complexData, 'data')

      expect(node.vtype).to.equal('object')
      expect(node.children).to.have.lengthOf(2)

      const usersNode = node.children!.find((n) => n.key === 'users')
      expect(usersNode).to.exist
      expect(usersNode!.vtype).to.equal('array')
      expect(usersNode!.children).to.have.lengthOf(2)

      const configNode = node.children!.find((n) => n.key === 'config')
      expect(configNode).to.exist
      expect(configNode!.vtype).to.equal('object')
    })

    it('should use default parameters correctly', () => {
      const node = JsonTreeConverter.convertJsonToTreeData({ test: 'value' })
      expect(node.key).to.equal('root')
      expect(node.id).to.equal('root')
    })

    it('should generate correct paths for nested nodes', () => {
      const obj = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      }

      const node = JsonTreeConverter.convertJsonToTreeData(obj, 'root', 'rootPath')
      expect(node.id).to.equal('rootPath')

      const level1Node = node.children!.find((n) => n.key === 'level1')
      expect(level1Node!.id).to.equal('rootPath.level1')

      const level2Node = level1Node!.children!.find((n) => n.key === 'level2')
      expect(level2Node!.id).to.equal('rootPath.level1.level2')
    })

    it('should handle arrays with mixed primitive and complex values', () => {
      const array = ['simple string', 42, { complex: 'object' }, ['nested', 'array'], null, true]

      const node = JsonTreeConverter.convertJsonToTreeData(array, 'mixedArray')

      expect(node.children).to.have.lengthOf(3)

      const primitiveGroup = node.children!.find((n) => n.key === '(primitives)')
      expect(primitiveGroup).to.exist
      expect(primitiveGroup!.name).to.include('{key|0}: {string|"simple string"}')
      expect(primitiveGroup!.name).to.include('{key|1}: {number|42}')
      expect(primitiveGroup!.name).to.include('{key|4}: {null|null}')
      expect(primitiveGroup!.name).to.include('{key|5}: {boolean|true}')

      const objectChild = node.children!.find((n) => n.key === '2')
      expect(objectChild).to.exist
      expect(objectChild!.vtype).to.equal('object')

      const arrayChild = node.children!.find((n) => n.key === '3')
      expect(arrayChild).to.exist
      expect(arrayChild!.vtype).to.equal('array')
    })

    it('should handle object with mixed primitive and complex values', () => {
      const obj = {
        name: 'Test',
        count: 5,
        active: true,
        metadata: null,
        config: {
          theme: 'dark',
        },
        items: [1, 2, 3],
      }

      const node = JsonTreeConverter.convertJsonToTreeData(obj, 'testObj')

      expect(node.children).to.have.lengthOf(3) // primitives group + config + items

      const primitiveGroup = node.children!.find((n) => n.key === '(primitives)')
      expect(primitiveGroup).to.exist
      expect(primitiveGroup!.name).to.include('{key|name}: {string|"Test"}')
      expect(primitiveGroup!.name).to.include('{key|count}: {number|5}')
      expect(primitiveGroup!.name).to.include('{key|active}: {boolean|true}')
      expect(primitiveGroup!.name).to.include('{key|metadata}: {null|null}')

      const configChild = node.children!.find((n) => n.key === 'config')
      expect(configChild).to.exist
      expect(configChild!.vtype).to.equal('object')

      const itemsChild = node.children!.find((n) => n.key === 'items')
      expect(itemsChild).to.exist
      expect(itemsChild!.vtype).to.equal('array')
    })

    it('should set correct itemStyle properties for all nodes', () => {
      const data = {
        str: 'test',
        num: 42,
        arr: [1, 2],
        obj: { nested: true },
      }

      const node = JsonTreeConverter.convertJsonToTreeData(data, 'testData')

      expect(node.itemStyle).to.deep.include({
        borderColor: '#cbd5e1',
        borderWidth: 1,
        borderRadius: 8,
      })

      const checkItemStyle = (n: JsonTreeNode) => {
        expect(n.itemStyle).to.exist
        expect(n.itemStyle.borderColor).to.equal('#cbd5e1')
        expect(n.itemStyle.borderWidth).to.equal(1)
        expect(n.itemStyle.borderRadius).to.equal(8)
        expect(n.label).to.exist

        if (n.children) {
          n.children.forEach(checkItemStyle)
        }
      }

      if (node.children) {
        node.children.forEach(checkItemStyle)
      }
    })

    it('should handle edge cases', () => {
      const funcNode = JsonTreeConverter.convertJsonToTreeData(() => {}, 'func')
      expect(funcNode.vtype).to.equal('function')
      expect(funcNode.name).to.include('{key|func}: {meta|')

      const dateObj = new Date('2024-01-01')
      const dateNode = JsonTreeConverter.convertJsonToTreeData(dateObj, 'date')
      expect(dateNode.vtype).to.equal('object')

      const deepObj = { a: { b: { c: { d: 'deep' } } } }
      const deepNode = JsonTreeConverter.convertJsonToTreeData(deepObj, 'deep')
      expect(deepNode.children).to.have.lengthOf(1)

      let current = deepNode.children![0]
      expect(current.key).to.equal('a')
      current = current.children![0]
      expect(current.key).to.equal('b')
      current = current.children![0]
      expect(current.key).to.equal('c')
      current = current.children![0]
      expect(current.key).to.equal('(primitives)')
      expect(current.name).to.include('{key|d}: {string|"deep"}')
    })

    it('should preserve raw values correctly', () => {
      const originalData = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
      }

      const node = JsonTreeConverter.convertJsonToTreeData(originalData, 'test')
      expect(node.raw).to.deep.equal(originalData)

      const primitiveGroup = node.children!.find((n) => n.key === '(primitives)')
      expect(primitiveGroup!.raw).to.deep.equal({
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
      })

      const arrayChild = node.children!.find((n) => n.key === 'array')
      expect(arrayChild!.raw).to.deep.equal([1, 2, 3])

      const objectChild = node.children!.find((n) => n.key === 'object')
      expect(objectChild!.raw).to.deep.equal({ nested: 'value' })
    })

    it('should handle arrays with only primitive values', () => {
      const array = ['a', 'b', 'c', 1, 2, 3]
      const node = JsonTreeConverter.convertJsonToTreeData(array, 'primitiveArray')

      expect(node.children).to.have.lengthOf(1)
      const primitiveGroup = node.children![0]
      expect(primitiveGroup.key).to.equal('(primitives)')
      expect(primitiveGroup.raw).to.deep.equal(['a', 'b', 'c', 1, 2, 3])
      expect(primitiveGroup.name.split('\n')).to.have.lengthOf(6)
    })

    it('should handle objects with only primitive values', () => {
      const obj = {
        str: 'value',
        num: 123,
        bool: false,
      }
      const node = JsonTreeConverter.convertJsonToTreeData(obj, 'primitiveObj')

      expect(node.children).to.have.lengthOf(1)
      const primitiveGroup = node.children![0]
      expect(primitiveGroup.key).to.equal('(primitives)')
      expect(primitiveGroup.raw).to.deep.equal(obj)
      expect(primitiveGroup.name.split('\n')).to.have.lengthOf(3)
    })
  })
})
