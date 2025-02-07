import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  success: boolean
  perfStats?: object
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(400).json({ success: false })
  }

  try {
    const resp = await fetch(
      `http://localhost:${process.env.PORT}/artbot/api/v1/horde-info/performance`,
      {
        method: 'GET'
      }
    )

    const data = await resp.json()
    const { perfStats = {} } = data

    return res.send({
      success: true,
      perfStats
    })
  } catch (err) {
    return res.send({
      success: true,
      perfStats: {}
    })
  }
}
