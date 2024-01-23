import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueries, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Inscriptions from './inscriptions'
import { useWallet } from '@/app/hooks'
import { getBalance, getUTXOs, getTx } from '@/utils/requests'
import { EXPLORER } from '@/utils'

const Content = () => {
  const search = useSearchParams()
  const { push } = useRouter()
  const address = search?.get('address')
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

  const { data: utxos } = useQuery({
    queryKey: ['utxo', address],
    queryFn: () => (address ? getUTXOs(address) : null),
    enabled: !!address,
  })

  const txList = utxos?.unspent_outputs.map((utxo) => utxo.tx_hash_big_endian) ?? []

  const txQueries = useQueries({
    queries: txList.map((tx) => ({
      queryKey: ['tx', tx],
      queryFn: () => getTx(tx),
      enabled: !!tx,
    })),
  })

  const list = useMemo(() => {
    return (
      utxos?.unspent_outputs.map((utxo) => {
        const tx = txQueries.find((q) => q.isSuccess && q.data.hash === utxo.tx_hash_big_endian)?.data
        const days = tx ? dayjs().diff(dayjs.unix(tx.time), 'day') : '-'
        const coinday = typeof days === 'number' ? BigInt(days) * BigInt(`0x${utxo.value_hex}`) : '-'

        return {
          ...utxo,
          days,
          coinday: `${coinday}`,
        }
      }) ?? []
    )
  }, [utxos, txQueries])

  const WalletBtn = () => {
    if (wallet.addr) {
      return (
        <button
          className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
          onClick={onWalletSwitch}
        >
          Disconnect
        </button>
      )
    }
    return (
      <button
        className="px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
        onClick={onWalletSwitch}
      >
        Connect
      </button>
    )
  }

  if (address && utxos?.unspent_outputs.length) {
    return (
      <div className="flex flex-col">
        <section>
          <WalletBtn />
          <div>{`Balance: ${balance?.toString() ?? '-'}`}</div>
          <div>{`UTXOs of ${address}, utxos with confirmation < 1 are ignored`}</div>
        </section>
        <section>
          <table className="w-full border-slate-400 mb-4">
            <thead>
              <tr>
                {['tx count', 'output count', 'value', 'coinday'].map((name) => (
                  <th key={name} className="px-2 text-left border border-slate-300">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 border border-slate-300">{new Set(list.map((u) => u.tx_hash)).size}</td>
                <td className="px-2 border border-slate-300">{list.length}</td>
                <td className="px-2 border border-slate-300">
                  {list.reduce((acc, cur) => acc + BigInt(`0x${cur.value_hex}`), BigInt(0)).toString()}
                </td>
                <td className="px-2 border border-slate-300">
                  {list
                    .reduce((acc, cur) => acc + (cur.coinday === '-' ? BigInt(0) : BigInt(cur.coinday)), BigInt(0))
                    .toString()}
                </td>
              </tr>
            </tbody>
          </table>
          <details>
            <summary>UTXO List</summary>
            <table className="w-full border-slate-400">
              <thead>
                <tr>
                  {['tx hash', 'output n', 'value', 'days', 'coinday'].map((name) => (
                    <th key={name} className="px-2 text-left border border-slate-300">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((utxo) => (
                  <tr key={utxo.tx_hash_big_endian + utxo.tx_output_n}>
                    <td className="px-2 border border-slate-300">
                      <a href={`${EXPLORER}/tx/${utxo.tx_hash_big_endian}`} rel="noopener noreferrer" target="_blank">
                        <code>{utxo.tx_hash_big_endian}</code>
                      </a>
                    </td>
                    <td className="px-2 border border-slate-300">{utxo.tx_output_n}</td>
                    <td className="px-2 border border-slate-300">{BigInt(`0x${utxo.value_hex}`).toString()}</td>
                    <td className="px-2 border border-slate-300">{utxo.days}</td>
                    <td className="px-2 border border-slate-300">{utxo.coinday}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
        <section>
          <Inscriptions address={address} />
        </section>
      </div>
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
