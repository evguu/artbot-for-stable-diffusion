import { clientHeader, getApiHostServer } from '../utils/appUtils'

interface CheckResponse {
  success: boolean
  message?: string
  status?: string
  finished?: number
  processing?: number
  waiting?: number
  done?: boolean
  faulted?: boolean
  wait_time?: number
  queue_position?: number
  jobId: string
}

// NOTE TO SELF: DO NOT MEMOIZE THIS API CALL. BAD THINGS HAPPEN.
// e.g., queuing up 1,000 image requests at once. FUN!
export const checkImageStatus = async (
  jobId: string
): Promise<CheckResponse> => {
  try {
    const res = await fetch(
      `${getApiHostServer()}/api/v2/generate/check/${jobId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Client-Agent': clientHeader()
        }
      }
    )

    const statusCode = res.status
    if (statusCode === 404) {
      return {
        success: false,
        status: 'NOT_FOUND',
        jobId
      }
    }

    if (statusCode === 429) {
      return {
        success: false,
        status: 'WAITING_FOR_PENDING_REQUEST',
        jobId
      }
    }

    const data = await res.json()

    return {
      success: true,
      ...data
    }
  } catch (err) {
    return {
      success: false,
      status: 'UNKNOWN_ERROR',
      jobId
    }
  }
}
