import { API_ENDPOINT, HIRO_ENDPOINT } from './constant'

export module BlockchainResponse {
  export interface UTXO {
    confirmations: number
    script: string
    tx_hash: string
    tx_hash_big_endian: string
    tx_index: number
    tx_output_n: number
    value: number
    value_hex: string
  }

  export interface Tx {
    hash: string
    ver: number
    vin_sz: number
    vout_sz: number
    size: number
    weight: number
    fee: number
    relayed_by: string
    lock_time: number
    tx_index: number
    double_spend: boolean
    time: number
    block_index: number
    block_height: number
    inputs: Array<{
      sequence: number
      witness: string
      script: string
      index: number
      prev_out: {
        addr: string
        n: number
        script: string
        spending_outpoints: [
          {
            n: number
            tx_index: number
          }
        ]
        spent: boolean
        tx_index: number
        type: number
        value: number
      }
    }>
    out: Array<{
      type: number
      spent: boolean
      value: number
      spending_outpoints: []
      n: number
      tx_index: number
      script: string
      addr: string
    }>
  }

  export interface Balance {
    final_balance: number
    n_tx: number
    total_received: number
  }
}

export module OKXResponse {
  export interface Ordinal {}
}

const request = (url: string, init?: RequestInit) => fetch(url, init).then((res) => res.json())

export const getUTXOs: (
  address: string,
  options?: Partial<Record<'confirmations' | 'limit', string>>
) => Promise<{
  unspent_outputs: Array<BlockchainResponse.UTXO>
}> = async (address, options = { confirmations: '1', limit: '1000' }) =>
  request(`${API_ENDPOINT}/unspent?${new URLSearchParams({ ...options, active: address })}`)

export const getTx: (hash: string) => Promise<BlockchainResponse.Tx> = (hash) =>
  request(`${API_ENDPOINT}/rawtx/${hash}`)

export const getBalance: (address: string) => Promise<{ [address: string]: BlockchainResponse.Balance }> = (address) =>
  request(`${API_ENDPOINT}/balance?${new URLSearchParams({ active: address })}`)

export const getInscriptions = (address: string) =>
  request(`${HIRO_ENDPOINT}/ordinals/v1/inscriptions?${new URLSearchParams({ address })}`)

export const getBrc20Balance = (
  address: string,
  ticker: string,
  options?: Record<'limit' | 'offset', string>
): Promise<Record<'ticker' | 'available_balance' | 'transferrable_balance' | 'overall_balance', string>> =>
  request(
    `${HIRO_ENDPOINT}/ordinals/v1/brc-20/balances/${address}?${new URLSearchParams({
      ticker,
      ...options,
    })}`
  ).then((res) => res.results[0])
