import * as React from 'elm-ts/lib/React'
import { render } from 'react-dom'
import * as component from './counter'
import './styles.css'

const program =
  process.env.NODE_ENV === 'production' ? React.program : programWithDebugger

const main = program(component.init, component.update, component.view)

React.run(main, (dom) => render(dom, document.getElementById('app')!))
