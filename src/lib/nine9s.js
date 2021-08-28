/* globals NINE9S_WEBHOOK_SECRET */

// @see https://nine9s.cloud/api/docs
export function isAuthenticated(headers) {
  return (
    headers.get('X-Webhook-Secret') === NINE9S_WEBHOOK_SECRET ||
    (headers.get('User-Agent') || '').startsWith('Nine9s.cloud Webhook Alerts')
  )
}

// @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
export function isWellFormattedEvent(event) {
  return (
    typeof event === 'object' &&
    event.event_type === 'endpoint.status.changed' &&
    typeof event.data === 'object'
  )
}

// @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
export function parseEvent({ data }) {
  const checkStatus = data.last_check_status

  return {
    endpoint: {
      name: data.name,
      url: data.endpoint_url,
      status: data.status,
      id: data.uuid,
    },
    status: checkStatus,
    statusDetails: data.last_check_message || null,
    ...parseHistory(data),
  }
}

function parseHistory({ history }) {
  if (!Array.isArray(history) || history.length === 0) return {}

  const [mostRecentCheck, ...rest] = history
  const responseTime = mostRecentCheck.response_time
  const timestamp = mostRecentCheck.created_at

  const parsed = {
    timestamp,
    responseTime,
  }

  if (!mostRecentCheck.ok) {
    return parsed
  }

  const lastGoodCheck = rest.find(x => x.ok)
  const earliestCheck = rest[rest.length - 1]

  const incidentDuration = timeDiffInMinutes(
    (lastGoodCheck || earliestCheck).created_at,
    timestamp,
  )

  return {
    ...parsed,
    incidentDuration,
    isIncidentDurationExact: !!lastGoodCheck,
  }
}

function timeDiffInMinutes(prev, now) {
  const prevTime = new Date(prev)
  const nowTime = new Date(now)

  return ((nowTime.getTime() - prevTime.getTime()) / 1000 / 60).toFixed(1)
}
