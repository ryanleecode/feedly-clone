import * as React from 'elm-ts/lib/React'
import { render } from 'react-dom'
import { programWithDebuggerWithFlags } from 'elm-ts/lib/Debug/Html'
import * as component from './feed'
import './styles.css'

const program =
  process.env.NODE_ENV === 'production'
    ? React.programWithFlags
    : programWithDebuggerWithFlags

const main = program(
  component.init,
  component.update,
  component.view,
  component.subscriptions,
)

React.run(main(new Date()), (dom) =>
  render(dom, document.getElementById('app')!),
)
