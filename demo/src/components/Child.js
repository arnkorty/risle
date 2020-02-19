import { h, useState, Fragment, useGlobalState } from '../../../src'
import { context } from './context'
const Container = (props) => {

    const { children } = props
    const [gstate, setContext] = useGlobalState(context)
    const [count, setCount] = useState(0)
    const arrs = []
    for(let i =0; i < 10; i ++) {
      arrs.push(i)
    }
    return (
      <div>
        <div onClick={() => setCount(count + 1)}>子自建： {count}</div>
    <Fragment> ojfojdsjfsdojfoj ojofijdosjfods{gstate.count}</Fragment>
      {
        arrs.map((i) => {
        return <div key={i}>{gstate.count} {Math.random()}</div>
        })
      }
        {/* {children} */}
      </div>
    )
}

export default Container
