/**
 * Scenario clocks → a sortable number.
 *
 * Datapack clocks are `HH:MM`, plus one authored tie-break: a trailing `+`
 * means "immediately after that minute" (우는다리's `21:04+`, the beat that
 * follows the collapse). Decision D7 gives it half a minute of ordering
 * weight, which sorts it after `21:04` and before the next whole minute
 * without inventing a second time axis.
 */

import { MINUTES_PER_HOUR } from './caps.ts'
import { ClockFormatError } from './errors.ts'

/** `HH:MM` with an optional single trailing `+`. Two digits each, always. */
const CLOCK_FORM = /^(\d\d):(\d\d)(\+?)$/

const LAST_HOUR = 23
const LAST_MINUTE = 59

/** Ordering weight of the trailing `+`. Less than one minute, more than zero. */
const PLUS_WEIGHT = 0.5

/**
 * @throws {ClockFormatError} when `clock` is not `HH:MM` / `HH:MM+`, or names
 * an hour or minute that does not exist.
 */
export function parseClock(clock: string): number {
  const parts = CLOCK_FORM.exec(clock)
  if (parts === null) {
    throw new ClockFormatError(`clock is not HH:MM or HH:MM+: ${JSON.stringify(clock)}`)
  }
  const hours = Number(parts[1])
  const minutes = Number(parts[2])
  if (hours > LAST_HOUR || minutes > LAST_MINUTE) {
    throw new ClockFormatError(`clock is out of range: ${JSON.stringify(clock)}`)
  }
  const weight = parts[3] === '+' ? PLUS_WEIGHT : 0
  return hours * MINUTES_PER_HOUR + minutes + weight
}
