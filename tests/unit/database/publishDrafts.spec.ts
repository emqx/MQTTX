import 'reflect-metadata'
import { expect } from 'chai'
import Store from 'electron-store'
import ConnectionService from '@/database/services/ConnectionService'
import CollectionService from '@/database/services/CollectionService'
import { getDefaultPublishDraft } from '@/utils/publishDraft'
import { setServices } from '../mocks/useServices'

const ids = ['persist-a', 'persist-b', 'persist-child', 'persist-other']

describe('Connection publish draft persistence', () => {
  let service: ConnectionService

  beforeEach(() => {
    service = new ConnectionService({} as any, {} as any, {} as any)
    ids.forEach((id) => service.deletePublishDraft(id))
  })

  afterEach(() => {
    ids.forEach((id) => service.deletePublishDraft(id))
    setServices({})
  })

  it('restores raw text, format and empty values from a fresh store instance', () => {
    service.getPublishDraft('persist-a')
    const draft = { ...getDefaultPublishDraft(), payload: '', topic: '', payloadType: 'Base64' as PayloadType }
    service.updatePublishDraft('persist-a', draft)
    const restartedStore = new Store()
    expect(restartedStore.get('publishDrafts.persist-a')).to.deep.equal(draft)
  })

  it('returns independent snapshots and leaves other connections unchanged', () => {
    const a = service.getPublishDraft('persist-a')
    a.payload = 'A only'
    expect(service.getPublishDraft('persist-a')).to.deep.equal(getDefaultPublishDraft())
    service.updatePublishDraft('persist-a', a)
    expect(service.getPublishDraft('persist-b')).to.deep.equal(getDefaultPublishDraft())
    a.payload = 'mutated caller'
    expect(service.getPublishDraft('persist-a').payload).to.equal('A only')
  })

  it('does not recreate a deleted draft on a late update', () => {
    service.getPublishDraft('persist-a')
    service.deletePublishDraft('persist-a')
    service.updatePublishDraft('persist-a', { ...getDefaultPublishDraft(), payload: 'late write' })
    expect(new Store().has('publishDrafts.persist-a')).to.equal(false)
  })

  it('removes the draft when its connection is deleted', async () => {
    service.getPublishDraft('persist-a')
    let deleted = false
    const query: any = {
      select: () => query,
      where: () => query,
      leftJoinAndSelect: () => query,
      getOne: async () => ({ id: 'persist-a' }),
    }
    service = new ConnectionService(
      {
        createQueryBuilder: () => query,
        delete: async () => {
          deleted = true
        },
      } as any,
      {} as any,
      {} as any,
    )
    await service.delete('persist-a')
    expect(deleted).to.equal(true)
    expect(new Store().has('publishDrafts.persist-a')).to.equal(false)
  })

  it('cleans drafts in the deleted group and every descendant, preserving other groups', async () => {
    ids.forEach((id) => service.getPublishDraft(id))
    const groups = [
      { id: 'group', children: [{ id: 'child-group' }] },
      { id: 'child-group', children: [] },
    ]
    let removed = false
    const collectionService = new CollectionService(
      {
        findOne: async () => groups[0],
        manager: { getTreeRepository: () => ({ findDescendants: async () => groups }) },
        remove: async () => {
          removed = true
        },
      } as any,
      {
        find: async (options: any) => {
          expect(options.where.parentId.value).to.deep.equal(['group', 'child-group'])
          return [{ id: 'persist-a' }, { id: 'persist-child' }]
        },
        delete: async () => {},
      } as any,
      {} as any,
    )
    setServices({ connectionService: service })
    await collectionService.delete('group')
    expect(removed).to.equal(true)
    const store = new Store()
    expect(store.has('publishDrafts.persist-a')).to.equal(false)
    expect(store.has('publishDrafts.persist-child')).to.equal(false)
    expect(store.has('publishDrafts.persist-other')).to.equal(true)
  })
})
