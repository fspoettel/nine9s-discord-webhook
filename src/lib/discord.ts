/* globals fetch, DISCORD_WEBHOOK_URL */

import { EndpointStatus } from './types/Nine9sWebhookEvent'
import { EventData } from './types/EventData'

/**
 * @see https://www.binaryhexconverter.com/hex-to-decimal-converter
 */
export function statusToDecimalColor(status: EndpointStatus): number {
  const statusColorMapping = {
    ok: 32768,
    degraded: 16766720,
    down: 16711680,
  }

  return statusColorMapping[status]
}

/**
 * @see https://birdie0.github.io/discord-webhooks-guide/discord_webhook.html
 * @see parseEvent
 */
export function createWebhookPayload(data: EventData): Record<string, unknown> {
  const embedFields: {
    name: string
    value: string | number
    inline?: boolean
  }[] = [
    {
      name: 'Endpoint',
      value: data.endpoint.name,
    },
    {
      name: 'Endpoint URL',
      value: data.endpoint.url,
    },
    {
      name: 'Status',
      value: data.status,
    },
  ]

  if (data.statusDetails) {
    embedFields.push({
      name: 'Status Details',
      value: data.statusDetails,
    })
  }

  if (data.status !== 'down' && data.responseTime) {
    embedFields.push({
      name: 'Response Time',
      value: `${data.responseTime}ms`,
      inline: true,
    })
  }

  if (data.incidentDuration) {
    embedFields.push({
      name: 'Incident Duration',
      value: `${data.incidentDuration}${
        data.isIncidentDurationExact ? ' min' : '+ min'
      }`,
      inline: true,
    })
  }

  if (data.timestamp) {
    embedFields.push({
      name: 'Timestamp',
      value: data.timestamp,
    })
  }

  return {
    content: data.status === 'down' ? '@here' : undefined,
    embeds: [
      {
        author: {
          name: 'Nine9s.cloud',
          url: 'https://nine9s.cloud/',
          icon_url: 'https://nine9s.cloud/static/logo.png',
        },
        color: statusToDecimalColor(data.status),
        title: 'Endpoint Status Change',
        fields: embedFields,
        footer: {
          text: `Status: ${data.endpoint.status}, Endpoint Id: #${data.endpoint.id}`,
        },
      },
    ],
  }
}

/**
 * @param {object} payload webhook payload
 * @returns {Response} discord API response
 */
export async function postWebhook(
  payload: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (res.status >= 300) {
    throw new Error('could not post webhook to discord')
  }
}
