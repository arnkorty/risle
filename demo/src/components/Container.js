import { h, Component, useState } from '../../../src'
const Container = (props) => {

    const { children } = props
    const [count, setCount] = useState(0)
    return (
      <div>
        <div onClick={() => setCount(count + 1)}>子自建： {count}</div>
        {Math.random() > 0.5 && children}
      </div>
    )
}

export default Container
