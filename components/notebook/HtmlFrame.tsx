'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  /** A full HTML document (typically starting with `<!DOCTYPE html>`). */
  html: string
  /** Initial iframe height in pixels. Will auto-resize to content if possible. */
  initialHeight?: number
}

/**
 * Renders a full HTML document inside a sandboxed `<iframe srcDoc>` so the
 * `<!DOCTYPE>`, `<html>`, `<head>` and `<body>` tags are valid and don't
 * trigger React hydration mismatches (which happen when such markup is
 * injected via `dangerouslySetInnerHTML` into a `<div>` — the browser's HTML
 * parser strips those tags, while the SSR'd string keeps them).
 */
export function HtmlFrame({ html, initialHeight = 520 }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(initialHeight)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    const resize = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return
        const h = Math.max(
          doc.documentElement?.scrollHeight ?? 0,
          doc.body?.scrollHeight ?? 0,
        )
        if (h > 0 && Math.abs(h - height) > 2) setHeight(h)
      } catch {
        // Cross-origin or not yet ready; keep current height.
      }
    }
    iframe.addEventListener('load', resize)
    const id = window.setInterval(resize, 750)
    return () => {
      iframe.removeEventListener('load', resize)
      window.clearInterval(id)
    }
    // We intentionally only re-run when html changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])

  return (
    <div className="nb-output nb-output--htmlframe">
      <iframe
        ref={ref}
        srcDoc={html}
        title="HTML output"
        loading="lazy"
        style={{
          width: '100%',
          height,
          border: '0',
          display: 'block',
          background: 'transparent',
        }}
      />
    </div>
  )
}

export default HtmlFrame
