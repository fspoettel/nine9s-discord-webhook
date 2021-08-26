addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * @param {Request} request
 */
async function handleRequest(request) {
  const { headers } = request

  // @see https://nine9s.cloud/api/docs
  if (
    headers.get('X-Webhook-Secret') !== NINE9S_WEBHOOK_SECRET ||
    !(headers.get('User-Agent') ?? '').startsWith('Nine9s.cloud Webhook Alerts')
  ) {
    return responses.badRequest()
  }

  let body = null

  try {
    body = await request.json()
    if (!isWellFormattedEvent(body)) {
      throw new TypeError('unexpected event format')
    }
  } catch (err) {
    return responses.badRequest()
  }

  try {
    await postDiscordWebhook(body.data)
    return responses.success()
  } catch (err) {
    console.error(err)
    return responses.internalError()
  }
}

// @see https://nine9s.cloud/api/docs#operation/retrieveEndpoint
function isWellFormattedEvent(body) {
  return (
    typeof body === 'object' &&
    body.event_type === 'endpoint.status.changed' &&
    typeof body.data === 'object'
  )
}

function postDiscordWebhook(data) {
  // @see https://www.binaryhexconverter.com/hex-to-decimal-converter
  const statusColorMapping = {
    ok: 32768,
    degraded: 16766720,
    down: 16711680,
  }

  const checkStatus = data.last_check_status

  return fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // @see https://birdie0.github.io/discord-webhooks-guide/discord_webhook.html
    body: JSON.stringify({
      embeds: [
        {
          author: {
            name: 'Nine9s.cloud',
            url: 'https://nine9s.cloud/',
            icon_url: 'https://nine9s.cloud/static/logo.png',
          },
          color: statusColorMapping[checkStatus],
          title: 'Endpoint Status Change',
          fields: [
            {
              name: 'Endpoint',
              value: data.name,
            },
            {
              name: 'Endpoint URL',
              value: data.endpoint_url,
            },
            {
              name: 'Status',
              value: checkStatus,
            },
            {
              name: 'Status Details',
              value: data.last_check_message ?? 'No information provided',
            },
            {
              name: 'Created At',
              value: data.created_at,
            },
          ],
          footer: {
            text: `Status: ${data.status}, Event Id: #${data.uuid}`,
          },
        },
      ],
    }),
  })
}

const responses = {
  success() {
    return new Response(null, { status: 200 })
  },
  badRequest() {
    return new Response(null, { status: 400 })
  },
  internalError() {
    return new Response(null, { status: 500 })
  },
}
