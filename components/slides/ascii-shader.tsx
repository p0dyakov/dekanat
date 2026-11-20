/*
 * Flow field — @lorentz · OpenShaders (MIT)
 * https://openshaders.com/@lorentz
 * WebGL2 port of the WebGPU single-pass shader.
 *
 * Changes for the deck: the page is white (the field fades out on the left
 * under the text), and `still` renders one frame into an <img> so the PDF
 * keeps the background.
 */

"use client"

import { type CSSProperties, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`

const FIELD_SHADER = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform float uLightMode;
uniform vec3 uDarkBackground;
uniform vec3 uLightBackground;
out vec4 fragColor;

// Tint = --fluid-accent #4F39F6 in linear sRGB; only its brightness varies.
const vec3 ACCENT = vec3(0.0782, 0.0408, 0.9259);
const float HUE_TRAVEL = 2.41652393;
const float COLOUR_CYCLE = 0.16700834;
const float THETA = 2.13515615;
const float SHEAR = 0.959515691;
const float SHRINK = 0.953708827;
const float LAYERS = 72.0;
const float WARP_FREQ_X = 0.400992185;
const float WARP_FREQ_Y = 2.41344643;
const float WARP_AMP_X = 0.157249883;
const float WARP_AMP_Y = 0.0295332707;
const float ASPECT_X = 2.1667285;
const float ASPECT_Y = 0.165144622;
const float OFFSET_X = 0.336125076;
const float OFFSET_Y = 0.0574673824;
const float TILT = 1.53259659;
const float ZOOM = 1.04306126;
const float CENTRE_X = -0.0849623606;
const float CENTRE_Y = -0.497023672;
const float GLOW_SIZE = 0.0024194608;
const float FALLOFF = 0.453996181;
const float VIGNETTE = 0.0874755457;
const float FLOW_SPEED = 0.399096489;
const float FLOW_DIRECTION = 1.0;
const float BREATH_RATE = 0.606666446;
const float BREATH_AMOUNT = 0.106455483;
const float PHASE = 6.57464647;
const float ECHO = 0.0;
const float ECHO_SHIFT = -0.180640414;
const float SOFTNESS = 0.00190258224;

float blueNoise(vec2 p, float frame) {
  p += 5.588238 * mod(frame, 64.0);
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

void main() {
  vec2 R = iResolution.xy;
  vec2 pos = (gl_FragCoord.xy - 0.5 * R) / R.y;
  float t = iTime * FLOW_SPEED * FLOW_DIRECTION + PHASE;
  float breath = (-sin(iTime * BREATH_RATE * 1.5) + sin(iTime * BREATH_RATE + 1.0)) * 0.25 + 0.5;

  vec2 u = (pos - vec2(CENTRE_X, CENTRE_Y)) * (ZOOM - breath * BREATH_AMOUNT);
  float ct = cos(TILT), st = sin(TILT);
  u = mat2(ct, st, -st, ct) * u;

  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));

  vec3 color = vec3(0.0);

  for (float i = 1.0; i <= 96.0; i += 1.0) {
    if (i > LAYERS) break;
    u.x += -sin(u.y * WARP_FREQ_X + t + i * 0.007) * WARP_AMP_X;
    u.y += -sin(u.x * WARP_FREQ_Y - t + i * 0.02) * WARP_AMP_Y;
    u = fold * u * SHRINK;

    vec2 q = u - vec2(OFFSET_X + breath * 0.1, OFFSET_Y);
    vec2 s = vec2(q.x * ASPECT_X, q.y * ASPECT_Y);
    float glow = GLOW_SIZE / (dot(s, s) + SOFTNESS);
    vec2 e = vec2((q.x - ECHO_SHIFT) * ASPECT_X, s.y);
    glow += ECHO * GLOW_SIZE / (dot(e, e) + SOFTNESS);
    glow *= 0.25 + breath * 0.4;

    float r = length(u);
    float k = sin(i * COLOUR_CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;
    vec3 tint = clamp(ACCENT * (0.55 + 0.60 * k), vec3(0.0), vec3(1.0));
    color += glow * tint * exp2(-r * FALLOFF);
  }

  vec3 x = max(color, 0.0);
  color = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  color = pow(clamp(color, 0.0, 1.0), vec3(0.85, 0.92, 0.98));

  float edge = smoothstep(0.5, 1.6, length(pos));
  color *= 1.0 - edge * VIGNETTE;

  vec3 dark = uDarkBackground + color * (1.0 - uDarkBackground);
  float strength = max(color.r, max(color.g, color.b));
  vec3 light = uLightBackground * (1.0 - strength) + color * 0.96;
  color = mix(dark, light, uLightMode);

  // Fade the field out towards the left edge, where the slide's text sits.
  color = mix(uLightBackground, color, smoothstep(0.34, 0.72, gl_FragCoord.x / R.x));

  color += (blueNoise(gl_FragCoord.xy, floor(iTime * 24.0)) - 0.5) / 255.0;
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`

const MAX_PIXELS = 2400000
const LIGHT: [number, number, number] = [1, 1, 1]
const DARK: [number, number, number] = [9 / 255, 9 / 255, 9 / 255]

interface AsciiShaderProps {
  /** Render one frame at this time into an image (print and PDF). */
  still?: number
  className?: string
  style?: CSSProperties
}

export function AsciiShader({ still, className, style }: AsciiShaderProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let handle: { destroy(): void } | null = null
    try {
      handle = createShader(element, still, (url) => setSnapshot(url))
    } catch (error) {
      console.error(error)
    }
    return () => handle?.destroy()
  }, [still])

  return (
    <div className={cn("relative", className)} style={style} aria-hidden="true">
      <canvas
        ref={canvas}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          opacity: snapshot ? 0 : 1,
        }}
      />
      {snapshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={snapshot}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}
    </div>
  )
}

function attach(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  type: number,
  source: string
) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("WebGL could not create a shader object.")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`)
  gl.attachShader(program, shader)
  gl.deleteShader(shader)
}

function compile(gl: WebGL2RenderingContext, fragmentSource: string) {
  const program = gl.createProgram()
  attach(gl, program, gl.VERTEX_SHADER, VERTEX_SHADER)
  attach(gl, program, gl.FRAGMENT_SHADER, fragmentSource)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`Shader failed to link: ${gl.getProgramInfoLog(program)}`)
  return program
}

function uniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly string[]
) {
  return Object.fromEntries(
    names.map((name) => [name, gl.getUniformLocation(program, name)])
  )
}

function createShader(
  canvas: HTMLCanvasElement,
  still: number | undefined,
  onSnapshot: (url: string) => void
) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: still !== undefined,
  })
  if (!gl) throw new Error("WebGL2 is not available in this browser.")
  // A fresh canvas is black until the first frame: start it on the page colour.
  gl.clearColor(1, 1, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  const field = compile(gl, FIELD_SHADER)
  const fieldUniforms = uniforms(gl, field, [
    "iResolution",
    "iTime",
    "uLightMode",
    "uDarkBackground",
    "uLightBackground",
  ])

  const setFrame = (
    locations: Record<string, WebGLUniformLocation | null>,
    time: number
  ) => {
    gl.uniform2f(locations.iResolution, canvas.width, canvas.height)
    gl.uniform1f(locations.iTime, time)
    gl.uniform1f(locations.uLightMode, 1)
    gl.uniform3fv(locations.uDarkBackground, DARK)
    gl.uniform3fv(locations.uLightBackground, LIGHT)
  }

  const fit = () => {
    const w0 = canvas.clientWidth,
      h0 = canvas.clientHeight
    if (!w0 || !h0) return 1
    const scale = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(MAX_PIXELS / (w0 * h0))
    )
    const w = Math.max(1, Math.floor(w0 * scale)),
      h = Math.max(1, Math.floor(h0 * scale))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    return w / w0
  }

  const draw = (time: number) => {
    fit()
    const { width, height } = canvas
    gl.viewport(0, 0, width, height)
    gl.useProgram(field)
    setFrame(fieldUniforms, time)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  let frame = 0
  let disposed = false
  let elapsed = 0
  let previous: number | null = null

  const tick = (now: number) => {
    if (disposed) return
    const delta = previous === null ? 0 : Math.min((now - previous) / 1000, 0.1)
    previous = now
    elapsed += delta
    if (!document.hidden) draw(elapsed)
    frame = requestAnimationFrame(tick)
  }

  if (still !== undefined) {
    // Wait a frame for layout, draw once, hand the pixels over as an image.
    frame = requestAnimationFrame(() => {
      draw(still)
      onSnapshot(canvas.toDataURL("image/jpeg", 0.92))
    })
  } else {
    frame = requestAnimationFrame(tick)
  }

  return {
    destroy() {
      disposed = true
      cancelAnimationFrame(frame)
      gl.deleteProgram(field)
    },
  }
}
