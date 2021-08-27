addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * @param {Request} request
 */
async function handleRequest(request) {
  if (!isAuthenticated(request.headers)) {
    return responses.badRequest()
  }

  let body = null

  try {
    body = await request.json()
    if (!isWellFormattedEvent(body)) {
      throw new TypeError('unexpected event format')
    }
  } catch (err) {
    console.log(err)
    return responses.badRequest()
  }

  try {
    await postDiscordWebhook(body.data)
    return responses.success()
  } catch (err) {
    console.log(err)
    return responses.internalError()
  }
}

function isAuthenticated(headers) {
  // @see https://nine9s.cloud/api/docs
  return (
    headers.get('X-Webhook-Secret') === NINE9S_WEBHOOK_SECRET ||
    (headers.get('User-Agent') ?? '').startsWith('Nine9s.cloud Webhook Alerts')
  )
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
  const checkStatus = data.last_check_status

  const embedFields = [
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
  ]

  if (data.history.length > 0) {
    const {
      createdAt,
      downTime,
      exactDowntime,
      responseTime,
    } = parseHistory(data.history)

    embedFields.push({
      name: 'Response Time',
      value: `${responseTime}ms`,
      inline: true,
    })

    if (downTime) {
      embedFields.push({
        name: 'Resolved After',
        value: `${downTime}${exactDowntime ? ' min' : '+ min'}`,
        inline: true,
      })
    }

    embedFields.push({
      name: 'Created At',
      value: createdAt,
    })
  }

  return fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // @see https://birdie0.github.io/discord-webhooks-guide/discord_webhook.html
    body: JSON.stringify({
      content: checkStatus === 'down' ? '@here' : undefined,
      embeds: [
        {
          author: {
            name: 'Nine9s.cloud',
            url: 'https://nine9s.cloud/',
            icon_url: 'https://nine9s.cloud/static/logo.png',
          },
          color: getColorForStatus(checkStatus),
          title: 'Endpoint Status Change',
          fields: embedFields,
          footer: {
            text: `Status: ${data.status}, Endpoint Id: #${data.uuid}`,
          },
        },
      ],
    }),
  })
}

function parseHistory(history) {
  const [mostRecentCheck, ...rest] = history
  const responseTime = mostRecentCheck.response_time
  const createdAt = mostRecentCheck.created_at

  if (!mostRecentCheck.ok) {
    return {
      createdAt,
      downTime: null,
      exactDowntime: false,
      responseTime
    }
  }

  const lastGoodCheck = rest.find(x => x.ok)
  const earliestCheck = rest[rest.length - 1]

  const downTime = timeDiffInMinutes(
    (lastGoodCheck ?? earliestCheck).created_at,
    mostRecentCheck.created_at,
  )

  return {
    createdAt,
    downTime,
    exactDowntime: !!lastGoodCheck,
    responseTime,
  }
}

function timeDiffInMinutes(prev, now) {
  const prevTime = new Date(prev)
  const nowTime = new Date(now)

  return ((nowTime.getTime() - prevTime.getTime()) / 1000 / 60).toFixed(1)
}

function getColorForStatus(status) {
  // @see https://www.binaryhexconverter.com/hex-to-decimal-converter
  const statusColorMapping = {
    ok: 32768,
    degraded: 16766720,
    down: 16711680,
  }

  return statusColorMapping[status]
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
