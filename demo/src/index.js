import {
  h,
  render
} from '../../src'
import Heading from './components/Heading'
import Container from './components/Container'
import Child from './components/Child'

const mountNode = document.getElementById('root')
console.log('render', render)
render((
  <Container>
    <Heading text='Hello World!' />
    <Child />
  </Container>
), mountNode)
