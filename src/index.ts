import * as React from 'elm-ts/lib/React'
import { render } from 'react-dom'
import { programWithDebugger } from 'elm-ts/lib/Debug/Html'
import * as component from './feed'
import './styles.css'

const program =
  process.env.NODE_ENV === 'production' ? React.program : programWithDebugger

const main = program(component.init, component.update, component.view)

React.run(main, (dom) => render(dom, document.getElementById('app')!))
