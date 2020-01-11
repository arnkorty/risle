import { h, useState, useGlobalState } from '../../../src'
import { context } from './context'

const Heading = (props) => {
  const [date, setDate] = useState(new Date().toLocaleDateString())
  const [_, setContext] = useGlobalState(context)

  const onChange= () => {
    setDate(new Date().toLocaleDateString() + Math.random())
    setDate(new Date().toLocaleDateString() + Math.random())
    setDate(new Date().toLocaleDateString() + Math.random())
    setDate(new Date().toLocaleDateString() + Math.random())
    setContext({count: Math.random()})
  }
return <h1 onClick={() => onChange()}>{props.text} {date}{_.count}</h1>
}

Heading.displayName = 'Heading'

export default Heading
