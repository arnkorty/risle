# Risle
类React 库，函数式 jsx

### useState
### useRef
### useReducer
### useCallback
### useMemo
### useMemo
### useEffect
### useLayoutEffect
### useGlobalState (类似 useContext)
```javascript
import { createGlobalState, useGlobalState, h } from '../../../src'

export const context = createGlobalState({
  msg
})

const Parent = (props) => {
  const [gstate, setContext] = useGlobalState(context)
  return (
    <div onClick={() => setContext({msg: '哈喽，hello word useGlobalState'})}>
      {gstate.msg}
    </div>
  )
}
const Child = (props) => {
  const [gstate, _] = useGlobalState(context)
  return (
    <div>
      共享 Parent 组建变量
      {gstate.msg} 
    </div>
  )
}


```


## License

[MIT](LICENSE).
