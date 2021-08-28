/* globals Response, console */

import { isAuthenticated, isWellFormattedEvent, parseEvent } from './nine9s'
import { createWebhookPayload, postWebhook } from './discord'

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

/**
 * @param {Request} request
 */
export async function handler(request) {
  if (!isAuthenticated(request.headers)) {
    return responses.badRequest()
  }

  let event = null

  try {
    event = await request.json()
    if (!isWellFormattedEvent(event)) {
      throw new TypeError('unexpected event format')
    }
  } catch (err) {
    console.log(err.message)
    return responses.badRequest()
  }

  try {
    const response = createWebhookPayload(parseEvent(event))
    await postWebhook(response)
    return responses.success()
  } catch (err) {
    console.log(err.message)
    return responses.internalError()
  }
}
