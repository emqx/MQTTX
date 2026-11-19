<template>
  <canvas ref="canvas" class="cloud-wire" :style="{ width: `${width}px`, height: `${height}px` }" aria-hidden="true" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

/** One message travelling between MQTTX and EMQX Cloud. */
interface Dot {
  /** Travelling towards Cloud; otherwise back towards MQTTX. */
  out: boolean
  y0: number
  y1: number
  r: number
  life: number
  t: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

@Component
export default class CloudWire extends Vue {
  private readonly width = 180
  private readonly height = 64
  private dots: Dot[] = []
  private frame = 0
  private last = 0
  private wait = 0
  private context: CanvasRenderingContext2D | null = null

  mounted(): void {
    const canvas = this.$refs.canvas as HTMLCanvasElement | undefined
    // getContext throws where canvas is unavailable (jsdom, a blocked GPU); the page works without the animation.
    try {
      this.context = canvas?.getContext('2d') || null
    } catch {
      this.context = null
    }
    if (!canvas || !this.context) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = this.width * ratio
    canvas.height = this.height * ratio
    this.context.scale(ratio, ratio)
    for (let n = 0; n < 16; n++) {
      this.spawn()
      this.dots[n].t = Math.random() * this.dots[n].life
    }
    // A still frame carries the same meaning without motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.draw()
      return
    }
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  beforeDestroy(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
  }

  private spawn(): void {
    this.dots.push({
      out: Math.random() < 0.55,
      y0: rand(8, this.height - 8),
      y1: rand(8, this.height - 8),
      // Squared so most messages are small and a few stand out.
      r: 1 + Math.random() ** 2 * 4,
      life: rand(1.1, 2.6),
      t: 0,
    })
  }

  private tick(now: number): void {
    // Clamp so a backgrounded window does not fast-forward the whole flight on return.
    const delta = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    this.wait -= delta
    if (this.wait <= 0) {
      this.spawn()
      this.wait = rand(0.03, 0.16)
    }
    for (const dot of this.dots) dot.t += delta
    this.dots = this.dots.filter((dot) => dot.t < dot.life)
    this.draw()
    this.frame = requestAnimationFrame(this.tick)
  }

  private draw(): void {
    const ctx = this.context
    if (!ctx) return
    ctx.clearRect(0, 0, this.width, this.height)
    const style = getComputedStyle(document.body)
    const green = style.getPropertyValue('--color-main-green').trim()
    const accent = style.getPropertyValue('--color-emqx').trim()
    for (const dot of this.dots) {
      const k = dot.t / dot.life
      const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      const x = dot.out ? eased * this.width : (1 - eased) * this.width
      const y = dot.y0 + (dot.y1 - dot.y0) * eased
      ctx.beginPath()
      // Grow in and shrink out, so dots appear and leave without fading.
      ctx.arc(x, y, dot.r * Math.sin(Math.PI * k), 0, Math.PI * 2)
      ctx.fillStyle = dot.r > 3 ? accent : green
      ctx.fill()
    }
  }
}
</script>

<style scoped lang="scss">
.cloud-wire {
  display: block;
  flex-shrink: 0;
}
</style>
