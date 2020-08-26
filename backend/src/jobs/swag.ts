import { pollFeedSources } from './__yolo2'
import { getObservableInterpreter } from './yolo-interpreter'
;(async () => {
  const observableI = getObservableInterpreter({} as any)

  const yolo = pollFeedSources(observableI)
})()
