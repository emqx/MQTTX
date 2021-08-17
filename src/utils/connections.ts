import _ from 'lodash'
export const flushCurSequenceId = (data: ConnectionModelTree[]): void => {
  data.forEach((el: ConnectionModelTree, idx: number) => {
    if (el.isCollection) {
      flushCurSequenceId(el.children)
    }
    el.orderId = idx
  })
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
