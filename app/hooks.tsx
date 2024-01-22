import { useState } from 'react'

export const useWallet = () => {
  const unisat: any = window['unisat' as keyof Window]

  const [addr, setAddr] = useState('')
  const [network, setNetwork] = useState('')

  const handleAccountChanged = (newAddr: string) => {
    if (newAddr && newAddr != addr) {
      setAddr(newAddr)
    }
  }

  const handleNetworkChanged = (newNetwork: string) => {
    if (newNetwork && newNetwork != network) {
      setNetwork(newNetwork)
    }
  }

  const connect = async () => {
    if (addr) return
    if (!unisat) {
      window.alert('Please install Unisat Wallet')
      return
    }

    try {
      const [newAddr]: Array<string> = await unisat.requestAccounts()
      setAddr(newAddr)
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      } else {
        console.error(e)
      }
    }

    unisat.on('accountsChanged', (addrList: Array<string>) => {
      handleAccountChanged(addrList[0])
    })
    unisat.on('networkChanged', handleNetworkChanged)
  }

  const disconnect = () => {
    setAddr('')
    unisat.removeListener('accountsChanged', handleAccountChanged)
    unisat.removeListener('networkChanged', handleNetworkChanged)
  }

  return {
    addr,
    connect,
    disconnect,
  }
}
