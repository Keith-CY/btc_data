import { API_ENDPOINT } from './constant'

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
}

export const getUTXOs: (
  address: string,
  options?: Partial<Record<'confirmations' | 'limit', string>>
) => Promise<{
  unspent_outputs: Array<BlockchainResponse.UTXO>
}> = async (address, options = { confirmations: '1', limit: '1000' }) =>
  fetch(`${API_ENDPOINT}/unspent?${new URLSearchParams({ ...options, active: address })}`).then((res) => res.json())

export const getTx: (hash: string) => Promise<BlockchainResponse.Tx> = async (hash) =>
  fetch(`${API_ENDPOINT}/rawtx/${hash}`).then((res) => res.json())
