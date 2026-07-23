type SoundName = 'tap' | 'draw' | 'select' | 'arrive' | 'success' | 'event'

const NOTES: Record<SoundName, readonly [number, number, number]> = {
  tap: [520, 0.035, 0.025],
  draw: [280, 0.025, 0.012],
  select: [660, 0.08, 0.035],
  arrive: [330, 0.16, 0.055],
  success: [784, 0.22, 0.055],
  event: [588, 0.28, 0.05],
}

export class GardenAudio {
  private context: AudioContext | null = null
  private muted = false

  get isMuted(): boolean {
    return this.muted
  }

  toggle(): boolean {
    this.muted = !this.muted
    if (!this.muted) this.play('tap')
    return this.muted
  }

  play(name: SoundName): void {
    if (this.muted) return
    const AudioContextConstructor = window.AudioContext
    if (!AudioContextConstructor) return

    this.context ??= new AudioContextConstructor()
    if (this.context.state === 'suspended') void this.context.resume()

    const [frequency, duration, volume] = NOTES[name]
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()

    oscillator.type = name === 'event' ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.18, now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    oscillator.connect(gain)
    gain.connect(this.context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)

    if (name === 'success' || name === 'event') {
      window.setTimeout(() => this.chime(frequency * 1.25, duration * 0.72, volume * 0.72), 90)
    }
  }

  private chime(frequency: number, duration: number, volume: number): void {
    if (!this.context || this.muted) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration)
  }
}
