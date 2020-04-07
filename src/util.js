export function assign(obj, ...args) {
  return Object.assign(obj, ...args)
}

export function removeNode(node) {
  let parentNode = node.parentNode;
  if (parentNode) parentNode.removeChild(node);
}

export function isFn(fn) {
  return typeof fn === 'function'
}

export function isChanged(a, b) {
  return !a || b.some((item, index) => item !== a[index])
}

export const defer = (fn, cb) => {
  return requestAnimationFrame(() =>{
    const value = fn()
    if (cb) {
      return cb(value)
    }
    return value
  })
}
// typeof Promise=='function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
