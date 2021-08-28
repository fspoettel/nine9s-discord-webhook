/* globals addEventListener */

import { handler } from './lib/handler'

addEventListener('fetch', event => {
  event.respondWith(handler(event.request))
})
