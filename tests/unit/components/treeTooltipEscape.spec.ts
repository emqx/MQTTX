import { expect } from 'chai'
import TreeView from '@/widgets/TreeView.vue'
import JSONViewer from '@/widgets/JSONViewer.vue'

const treeMethods = (TreeView as any).options.methods
const jsonViewerMethods = (JSONViewer as any).options.methods

const XSS = '<img src=x onerror=alert(1)>'

const callTooltipFormatter = (params: Record<string, any>) =>
  treeMethods.tooltipFormatter.call({ transformTreeAncestors: treeMethods.transformTreeAncestors }, params) as string

const callJsonTooltipFormatter = (params: Record<string, any>) =>
  jsonViewerMethods.customTooltipFormatter.call({}, params) as string

const renderIntoDiv = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

const expectNoLiveElements = (html: string) => {
  const div = renderIntoDiv(html)
  expect(div.querySelector('img')).to.equal(null)
  expect(div.querySelector('script')).to.equal(null)
}

describe('Tree tooltip HTML escaping', () => {
  it('escapes a malicious topic level label, ancestors and payload', () => {
    const html = callTooltipFormatter({
      name: 'root',
      treeAncestors: [{ name: 'root' }, { name: XSS }],
      data: {
        label: XSS,
        messageCount: 1,
        subTopicCount: 2,
        message: { payload: XSS, createAt: '2024-01-01 00:00:00' },
      },
    })

    expect(html).to.contain('&lt;img')
    expect(html).not.to.contain('<img')
    expectNoLiveElements(html)
  })

  it('escapes a malicious payload and keeps the remaining markup intact', () => {
    const html = callTooltipFormatter({
      name: 'root',
      treeAncestors: [{ name: 'root' }],
      data: {
        label: 'leaf',
        messageCount: 1,
        subTopicCount: 0,
        message: { payload: XSS, createAt: '2024-01-01 00:00:00' },
      },
    })

    expect(html).to.contain('&lt;img')
    expect(html).not.to.contain('<img')
    expect(html).to.contain('class="tooltip-topic-value"')
    expectNoLiveElements(html)
  })

  it('escapes the fallback branch when params.data is missing', () => {
    const html = callTooltipFormatter({ name: XSS })

    expect(html).to.contain('&lt;img')
    expect(html).not.to.contain('<img')
    expectNoLiveElements(html)
  })

  it('truncates the raw payload before escaping so no entity is cut in half', () => {
    const payload = `${'a'.repeat(44)}${XSS}`
    const html = callTooltipFormatter({
      name: 'root',
      treeAncestors: [{ name: 'root' }],
      data: {
        label: 'leaf',
        messageCount: 1,
        subTopicCount: 0,
        message: { payload, createAt: '2024-01-01 00:00:00' },
      },
    })

    expect(payload.length).to.be.greaterThan(50)
    expect(html).to.contain('...')
    expect(html).to.contain('&lt;')
    expect(html).not.to.contain('<img')
    expectNoLiveElements(html)
  })
})

describe('JSON tree tooltip HTML escaping', () => {
  it('escapes a malicious JSON key path while keeping the tooltip content', () => {
    const html = callJsonTooltipFormatter({
      data: { id: `root.${XSS}`, vtype: 'string', children: [] },
    })

    expect(html).to.contain('&lt;img')
    expect(html).not.to.contain('<img')
    expect(html).to.contain('Children: 0')
    expectNoLiveElements(html)
  })
})
