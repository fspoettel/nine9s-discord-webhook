/**
 * @param {string} prev utc date string
 * @param {string} now utc date string
 * @returns {number}
 */
 export function timeDiffInMinutes(prev, now) {
  const prevTime = new Date(prev)
  const nowTime = new Date(now)

  return ((nowTime.getTime() - prevTime.getTime()) / 1000 / 60).toFixed(1)
}

/**
 * @see https://www.binaryhexconverter.com/hex-to-decimal-converter
 * @param {string} status
 * @returns {number} color encoded in decimal
 */
export function statusToDecimalColor(status) {
  const statusColorMapping = {
    ok: 32768,
    degraded: 16766720,
    down: 16711680,
  }

  return statusColorMapping[status]
}
