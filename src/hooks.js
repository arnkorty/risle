import { enqueueRender } from './component'
import { isFn, isChanged, defer } from './util'
import { USE_CALLBACK, USE_STATE, USE_REDUCER, USE_REF, USE_EFFECT,
        USE_GLOBAL_STATE, USE_LAYOUT_EFFECT, USE_MEMO } from './constants'
let currentIndex;

let currentComponent;

export function setCurrentVNode(vnode) {
  currentComponent = vnode._component
  currentIndex = 0
}

/**
 * hook [
 *  value,
 *  type,
 *  args,
 *  cb
 * ]
 */
export function getHook() {
  const cursor = currentIndex ++
  const current = currentComponent
  const hooks = current.hooks || (current.hooks = [])
  // const currentIndex = getCurrentHookCursor()
  const hook = hooks[cursor] || (hooks[cursor] = [])
  // if (!hook.mounted)
  return [hook, current]
}
export function useReducer(reducer, initState) {
  const [ hook, current] = getHook(currentIndex ++)
  const setter = (value) => {
    const newValue = reducer 
      ? reducer(hook[0], value)
      : (
        isFn(value)
        ? value(hook[0])
        : value
      )
    if (hook[0] !== newValue) {
      hook[0] = newValue
      enqueueRender(current)
    }
  }
  if (!hook[1]) {
    hook[0] = initState
    hook[1] = reducer ? USE_REDUCER : USE_STATE
  }
  return [hook[0], setter]
  // return hook
}

export function useState(initState) {
  return useReducer(null, initState)
}

function _memo(cb, deps, useType) {
  let [hook] = getHook()
  if (!hook.useType) {
    hook.useType = useType
  }
  if (isChanged(hook[2], deps)) {
    hook[2] = deps
    return (hook[0] = cb)
  }
  return hook[0]
}

export function useMemo(cb, deps) {
  return _memo(cb, deps, USE_MEMO)
}

export function useCallback(cb, deps) {
  return _memo(() => cb(), deps, USE_CALLBACK)
}

export function useRef(current) {
  return _memo(() => ({current}), [], USE_REF)
}

export function useEffect(cb, deps) {
  _effect(cb, deps, USE_EFFECT)
}
export function useLayoutEffect(cb, deps) {
  _effect(cb, deps, USE_LAYOUT_EFFECT)
}

function _effect(cb, deps, useType) {
  const [hook] = getHook()
  if (isChanged(hook[2], deps)) {
    hook[0] = useCallback(cb, deps)
    hook[1] = useType
    hook[2] = deps
    // console.log('effect...', console.log(hook[0]))
    // if (useType === useEffect) {
    //   defer(hook[0]).then((value) => hook[3] = value)
    // } else {
    //   hook[3] = hook[0]()
    // }
  }
}

export function createGlobalState(initState) {
  let ctx = initState
  const stacks = []
  return (hook, current) => {
    useLayoutEffect(() => {
      if (!stacks.includes(current)) {
        stacks.push(current)
      }
      return () => {
        const index = stacks.indexOf(current)
        if (index > -1) {
          stacks.splice(index, 1)
        }
      }
    }, [])
    if (!hook[3]) {
      hook[1] = USE_GLOBAL_STATE
       hook[3] = (value) => {
        hook[0] = ctx = value
        enqueueRender(current)
        stacks.forEach(c => c !== current && defer(enqueueRender(c)))
      }
    }
    return [ctx, hook[3]]
  }
}

export function useGlobalState(context) {
  const [hook, current] = getHook()
  return context(hook, current)
}
