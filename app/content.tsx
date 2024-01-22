import { getUTXOs, getTx } from '@/utils/requests'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import dayjs from 'dayjs'

const Content = () => {
  const search = useSearchParams()
  const address = search.get('address')

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

  if (utxos?.unspent_outputs.length) {
    return (
      <section>
        <div>{address}</div>

        <table className="border-collapse border border-slate-400">
          <thead>
            <tr>
              <th className="border-slate-300">tx_hash_big_endian</th>
              <th className="border-slate-300">tx_output_n</th>
              <th className="border-slate-300">value</th>
              <th className="border-slate-300">days</th>
            </tr>
          </thead>
          <tbody>
            {list.map((utxo) => (
              <tr key={utxo.tx_hash_big_endian}>
                <td>{utxo.tx_hash_big_endian}</td>
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
  return <div>{address}</div>
}

export default Content
