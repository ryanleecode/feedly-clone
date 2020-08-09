declare module 'kill-port' {
  function killPort(port: number, method?: 'tcp' | 'udp'): Promise<unknown>
  export = killPort
}
