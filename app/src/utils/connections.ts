import useServices from '@/database/useServices'

export const flushCurSequenceId = async (tree: ConnectionModelTree[]) => {
  if (!tree || !tree.length) return
  const { connectionService, collectionService } = useServices()
  await Promise.all(
    tree.map(async (treeNode: ConnectionModelTree, idx: number) => {
      treeNode.orderId = idx
      if (treeNode.isCollection) {
        await flushCurSequenceId(treeNode.children)
        await collectionService.updateSequenceId(treeNode.id, treeNode.orderId)
      } else {
        await connectionService.updateSequenceId(treeNode.id, treeNode.orderId)
      }
    }),
  )
}

export const sortConnectionTree = (data: ConnectionModelTree[]): void => {
  data.sort((a: ConnectionModelTree, b: ConnectionModelTree) => {
    if ((!a.isCollection || !b.isCollection) && (a.isCollection || b.isCollection)) {
      return a.isCollection ? -1 : 1
    }
    const sequenceIdA: number = a.orderId === undefined || a.orderId === null ? Number.MAX_SAFE_INTEGER : a.orderId
    const sequenceIdB: number = b.orderId === undefined || b.orderId === null ? Number.MAX_SAFE_INTEGER : b.orderId
    return sequenceIdA - sequenceIdB
  })
}
