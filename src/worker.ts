/* globals addEventListener */

declare global {
  const DISCORD_WEBHOOK_URL: string
  const NINE9S_WEBHOOK_SECRET: string
}

import { handler } from './lib/handler'

addEventListener('fetch', event => {
  event.respondWith(handler(event.request))
})
