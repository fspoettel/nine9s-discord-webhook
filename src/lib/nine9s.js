/* globals NINE9S_WEBHOOK_SECRET */

import { timeDiffInMinutes } from "./helpers"

/**
 * @see https://nine9s.cloud/api/docs
 * @param {Headers} headers
 * @returns {boolean}
 */
export function isAuthenticated(headers) {
  return (
    headers.get('X-Webhook-Secret') === NINE9S_WEBHOOK_SECRET ||
    (headers.get('User-Agent') || '').startsWith('Nine9s.cloud Webhook Alerts')
  )
}

/**
 * @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
 * @param {unknown} event event received via webhook
 * @returns {boolean}
 */
export function isWellFormattedEvent(event) {
  return (
    typeof event === 'object' &&
    event.event_type === 'endpoint.status.changed' &&
    typeof event.data === 'object'
  )
}

/**
 * @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
 * @param {object} event validated nine9s webhook event
 * @returns
 */
export function parseEvent({ data }) {
  return {
    endpoint: {
      name: data.name,
      url: data.endpoint_url,
      status: data.status,
      id: data.uuid,
    },
    status: data.last_check_status,
    statusDetails: data.last_check_message || null,
    ...parseHistory(data.history),
  }
}

function parseHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return {}

  const [mostRecentCheck, ...rest] = history
  const responseTime = mostRecentCheck.response_time
  const timestamp = mostRecentCheck.created_at

  const parsed = {
    timestamp,
    responseTime,
  }

  if (!mostRecentCheck.ok || rest.length === 0) {
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

