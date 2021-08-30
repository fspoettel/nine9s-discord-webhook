import { EndpointStatus } from './Nine9sWebhookEvent'

export type EventData = {
  endpoint: {
    name: string
    url: string
    status: string
    id: string
  }
  status: EndpointStatus
  timestamp: string
  // nullable by API
  statusDetails?: string
  // `null` when check.status === 'down'
  responseTime?: number
  // `null` when check.status !== `ok` (signaling previous incident)
  incidentDuration?: string
  isIncidentDurationExact?: boolean
}
