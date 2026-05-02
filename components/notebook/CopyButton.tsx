'use client'

import { useCallback, useState } from 'react'

interface Props {
  text: string
  /** Tooltip label; defaults to "Copy code". */
  label?: string
}

/**
 * Minimal, dependency-free copy-to-clipboard button for code cells.
 * Client component because it uses the Clipboard API + local state.
 */
export function CopyButton({ text, label = 'Copy code' }: Props) {
  const [copied, setCopied] = useState(false)

  const onClick = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Legacy fallback for non-secure contexts.
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* swallow — nothing sensible to do */
    }
  }, [text])

  return (
    <button
      type="button"
      className={'nb-copy' + (copied ? ' nb-copy--done' : '')}
      onClick={onClick}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied!' : label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M3.5 10.5V3.5a1 1 0 0 1 1-1h7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  )
}
