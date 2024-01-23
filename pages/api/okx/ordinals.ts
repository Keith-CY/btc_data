/**
 * Got balance successfully but failed to get info of other address, "invalid authority" returned
 *
 **/
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'node:crypto'
import { OKX_ENDPOINT, API_KEY, SECRET_KEY, PASSPHRASE } from './utils'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req
  const { address, slug, cursor, limit } = query
  if (!address) {
    return res.status(400).json({ error: 'Missing address' })
  }

  const REQ_PATH = `/api/v5/mktplace/nft/ordinals/get-valid-inscriptions`

  const body = JSON.stringify({
    slug: 'BTC Ordinals',
    walletAddress: query.address,
    limit: limit || '10',
    isBrc20: false,
  })

  const method = 'POST'
  const timestamp = new Date().toISOString()
  const message = `${timestamp}${method}${REQ_PATH}${body}`

  const sign = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': API_KEY,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': PASSPHRASE,
    'OK-ACCESS-SIGN': sign,
  }
  console.log(timestamp)

  try {
    const response = await fetch(`${OKX_ENDPOINT}${REQ_PATH}`, {
      method,
      headers,
      body: body,
    }).then((r) => r.json())
    return res.status(200).json(response)
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : e })
  }
}
