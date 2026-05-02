import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { joinSource } from './utils'
import type { NotebookCell } from './types'

interface Props {
  cell: NotebookCell
  index: number
}

/**
 * Strip patterns that Jupyter emits but that cause visual noise or React
 * warnings when rendered verbatim:
 *   - empty named HTML anchors: <a name="foo"></a> / <a id="foo"></a>
 *   - images with empty `src`: ![alt]()
 *   - collapse resulting run of blank lines
 */
function cleanMarkdown(src: string): string {
  return src
    .replace(/<a\s+(?:name|id)\s*=\s*(['"])[^'"]*\1\s*>\s*<\/a>/gi, '')
    .replace(/!\[[^\]]*\]\(\s*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const components: Components = {
  // Drop images without a real src (avoids the "empty src" warning).
  img(props) {
    const { src, alt } = props
    if (!src || typeof src !== 'string' || src.trim() === '') return null
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ''} loading="lazy" />
  },
  // Skip paragraphs that end up empty after filtering (e.g. only contained
  // an empty anchor).
  p(props) {
    const { children } = props
    const isEmpty =
      children == null ||
      (typeof children === 'string' && children.trim() === '') ||
      (Array.isArray(children) &&
        children.every(
          c => c == null || (typeof c === 'string' && c.trim() === ''),
        ))
    if (isEmpty) return null
    return <p>{children}</p>
  },
}

export function MarkdownCell({ cell, index }: Props) {
  const text = cleanMarkdown(joinSource(cell.source))
  if (!text) return null
  return (
    <section className="nb-cell nb-cell--markdown" aria-label={`Markdown cell ${index + 1}`}>
      <span className="nb-cell-index">{index + 1}</span>
      <span className="nb-badge nb-badge--md" aria-label="Markdown cell">MD</span>
      <div className="nb-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {text}
        </ReactMarkdown>
      </div>
    </section>
  )
}
