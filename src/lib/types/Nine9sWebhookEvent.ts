export type EndpointStatus = 'down' | 'ok' | 'degraded'

export type Nine9sWebhookEvent = {
  event_type: 'endpoint.status.changed'
  data: {
    created_at: string
    endpoint_url: string
    // TODO: figure out whether this is indeed `nullable`
    history?: {
      created_at: string
      response_time: number
      ok: boolean
    }[]
    last_check_message?: string
    last_check_status: EndpointStatus
    name: string
    status: 'active' | 'inactive'
    uuid: string
  }
}

export function isNine9sWebhookEvent(x: unknown): x is Nine9sWebhookEvent {
  return (
    typeof x === 'object' &&
    x != null &&
    'event_type' in x &&
    'data' in x &&
    (x as Nine9sWebhookEvent).event_type === 'endpoint.status.changed' &&
    typeof (x as Nine9sWebhookEvent).data === 'object' &&
    'last_check_status' in (x as Nine9sWebhookEvent).data
  )
}
