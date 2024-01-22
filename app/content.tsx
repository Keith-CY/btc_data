import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useWallet } from '@/app/hooks'
import { getBalance, getUTXOs, getTx, BlockchainResponse } from '@/utils/requests'
import { EXPLORER } from '@/utils'

const Content = () => {
  const search = useSearchParams()
  const { push } = useRouter()
  const address = search.get('address')
  const wallet = useWallet()

  useEffect(() => {
    if (wallet.addr) {
      push(`${window.location.pathname}?address=${wallet.addr}`)
    }
  }, [wallet.addr])

  const onWalletSwitch = async () => {
    try {
      if (wallet.addr) {
        wallet.disconnect()
      } else {
        await wallet.connect()
      }
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      } else {
        console.error(e)
      }
    }
  }

  const { data: balance } = useQuery({
    queryKey: ['balance', address],
    queryFn: () => (address ? getBalance(address).then((res) => res?.[address]?.final_balance ?? 0) : null),
    enabled: !!address,
  })

  // const balance = address !== null && balances ? balances[address as keyof BlockchainResponse.Balance] ?? 0 : 0

  const { data: utxos } = useQuery({
    queryKey: ['utxo', address],
    queryFn: () => (address ? getUTXOs(address) : null),
    enabled: !!address,
  })

  const txList = utxos?.unspent_outputs.map((utxo) => utxo.tx_hash_big_endian) ?? []

  const { data: txs = [] } = useQuery({
    queryKey: ['txs', txList.join(',')],
    queryFn: () =>
      Promise.allSettled(txList.map((tx) => getTx(tx))).then((res) =>
        res.map((i) => (i.status === 'fulfilled' ? i.value : null))
      ),
    enabled: !!txList.length,
  })

  const list = useMemo(() => {
    return (
      utxos?.unspent_outputs.map((utxo) => {
        const tx = txs.find((tx) => tx?.hash === utxo.tx_hash_big_endian)
        return {
          ...utxo,
          days: tx?.time ? dayjs().diff(dayjs.unix(tx.time), 'day') : '-',
        }
      }) ?? []
    )
  }, [utxos, txs])

  const WalletBtn = () => {
    if (wallet.addr) {
      return <button onClick={onWalletSwitch}>Disconnect</button>
    }
    return <button onClick={onWalletSwitch}>Connect</button>
  }

  if (utxos?.unspent_outputs.length) {
    return (
      <section>
        <WalletBtn />
        <div>{`UTXOs of ${address}`}</div>
        <div>{`Balance: ${balance?.toString() ?? '-'}`}</div>

        <table>
          <thead>
            <tr>
              <th align="left">tx_hash_big_endian</th>
              <th align="left">tx_output_n</th>
              <th align="left">value</th>
              <th align="left">days</th>
            </tr>
          </thead>
          <tbody>
            {list.map((utxo) => (
              <tr key={utxo.tx_hash_big_endian}>
                <td>
                  <a href={`${EXPLORER}/tx/${utxo.tx_hash_big_endian}`} rel="noopener noreferrer" target="_blank">
                    <code>{utxo.tx_hash_big_endian}</code>
                  </a>
                </td>
                <td>{utxo.tx_output_n}</td>
                <td>{BigInt(`0x${utxo.value_hex}`).toString()}</td>
                <td>{utxo.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }
  return (
    <div>
      <WalletBtn />
      {address}
    </div>
  )
}

export default Content
