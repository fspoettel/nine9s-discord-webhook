/* globals NINE9S_WEBHOOK_SECRET */

import { EventData } from './types/EventData'
import { Nine9sWebhookEvent } from './types/Nine9sWebhookEvent'

/**
 * @see https://nine9s.cloud/api/docs
 */
export function isAuthenticated(headers: Headers): boolean {
  return (
    headers.get('X-Webhook-Secret') === NINE9S_WEBHOOK_SECRET ||
    (headers.get('User-Agent') || '').startsWith('Nine9s.cloud Webhook Alerts')
  )
}

/**
 * @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
 */
export function isWellFormattedEvent(x: unknown): x is Nine9sWebhookEvent {
  return (
    typeof x === 'object' &&
    x != null &&
    'event_type' in x &&
    'data' in x &&
    (x as Nine9sWebhookEvent).event_type === 'endpoint.status.changed' &&
    typeof (x as Nine9sWebhookEvent).data === 'object' &&
    (x as Nine9sWebhookEvent).data != null &&
    typeof (x as Nine9sWebhookEvent).data.last_check_status === 'string'
  )
}

/**
 * @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
 */
export function parseEvent(event: Nine9sWebhookEvent): EventData {
  const { data } = event

  return {
    endpoint: {
      name: data.name,
      url: data.endpoint_url,
      status: data.status,
      id: data.uuid,
    },
    status: data.last_check_status,
    statusDetails: data.last_check_message || undefined,
    timestamp: data.created_at,
    ...parseHistory(event),
  }
}

function parseHistory(event: Nine9sWebhookEvent) {
  const {
    data: { history },
  } = event
  if (!Array.isArray(history) || history.length === 0) return null

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

function timeDiffInMinutes(prev: string, now: string): string {
  const prevTime = new Date(prev)
  const nowTime = new Date(now)

  return ((nowTime.getTime() - prevTime.getTime()) / 1000 / 60).toFixed(1)
}
