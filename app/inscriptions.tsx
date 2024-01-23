import { useState, type FC } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getInscriptions, getBrc20Balance } from '@/utils/requests'

const DEFAULT_TICKERS = ['ordi', 'sats']
const Inscriptions: FC<{ address: string }> = ({ address }) => {
  const [tickers, setTickers] = useState(DEFAULT_TICKERS)

  const { data: inscriptions } = useQuery({
    queryKey: ['inscriptions', address],
    queryFn: () => (address ? getInscriptions(address) : null),
    // enabled: !!address,
    enabled: false,
  })
  console.log(inscriptions)

  const inscriptionQueries = useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: ['ticker', ticker],
      queryFn: () => getBrc20Balance(address, ticker),
      enabled: !!ticker,
    })),
  })

  const handleSetTickers = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setTickers(e.currentTarget.tickers.value.split(',').map((ticker: string) => ticker.trim()))
  }
  return (
    <div className="mt-4">
      <form className="flex flex-col" onSubmit={handleSetTickers}>
        <label className="flex">
          Tickers:
          <input
            type="text"
            name="tickers"
            className="border flex-1 ml-2"
            defaultValue={`${DEFAULT_TICKERS.join(',')}`}
          />
        </label>
        <button
          type="submit"
          className="self-center my-2 px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm"
        >
          Confirm
        </button>
      </form>
      <table className="border w-full text-left">
        <thead>
          <tr>
            {['ticker', 'balance'].map((header) => (
              <th key={header} className="px-2 text-left border border-slate-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inscriptionQueries.map((query, i) => {
            const { data } = query
            return (
              <tr key={i}>
                <td className="px-2 border border-slate-300">{tickers[i]}</td>
                <td className="px-2 border border-slate-300">{data?.overall_balance}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
export default Inscriptions
