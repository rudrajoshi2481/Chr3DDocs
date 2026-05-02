import fs from 'node:fs/promises'
import path from 'node:path'
import { CodeCell } from './CodeCell'
import { MarkdownCell } from './MarkdownCell'
import type { Notebook, WidgetStateMap } from './types'
import './notebook.css'

interface Props {
  /**
   * Path to the .ipynb file relative to the project's `public/` directory,
   * e.g. "/example.ipynb" or "notebooks/intro.ipynb". A leading slash is
   * optional.
   */
  src: string
  /** Override the language for syntax highlighting (default: notebook's). */
  language?: string
  /** Optional className for the outer wrapper. */
  className?: string
  /** Hide the small header row showing language + source file. */
  showHeader?: boolean
}

async function loadNotebook(src: string): Promise<Notebook> {
  const relative = src.replace(/^\/+/, '')
  const filePath = path.join(process.cwd(), 'public', relative)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as Notebook
}

function extractWidgetState(nb: Notebook): WidgetStateMap {
  const root = nb.metadata?.widgets?.['application/vnd.jupyter.widget-state+json']
  if (!root) return {}
  // ipywidgets v2+ wraps the map under a `state` key; older notebooks store
  // model_id -> entry directly. Support both.
  if (root.state && typeof root.state === 'object') {
    return root.state as WidgetStateMap
  }
  // The remaining top-level keys (excluding `version_major`/`version_minor`)
  // are model_id -> entry.
  const out: WidgetStateMap = {}
  for (const [k, v] of Object.entries(root)) {
    if (k === 'version_major' || k === 'version_minor') continue
    if (v && typeof v === 'object' && 'state' in (v as object)) {
      out[k] = v as WidgetStateMap[string]
    }
  }
  return out
}

export async function NotebookRenderer({
  src,
  language,
  className,
  showHeader = true,
}: Props) {
  const nb = await loadNotebook(src)
  const lang =
    language ??
    nb.metadata?.language_info?.name ??
    nb.metadata?.kernelspec?.language ??
    'python'
  const widgetState = extractWidgetState(nb)

  return (
    <div className={'nb-root ' + (className ?? '')}>
      {showHeader && (
        <header className="nb-meta">
          <span className="nb-meta-tag">{lang}</span>
          <span className="nb-meta-sep" aria-hidden="true">·</span>
          <span className="nb-meta-file">{src}</span>
        </header>
      )}
      <div className="nb-cells">
        {nb.cells.map((cell, i) => {
          if (cell.cell_type === 'markdown') {
            return <MarkdownCell key={i} cell={cell} index={i} />
          }
          if (cell.cell_type === 'code') {
            return (
              <CodeCell
                key={i}
                cell={cell}
                index={i}
                language={lang}
                widgetState={widgetState}
              />
            )
          }
          return (
            <section
              key={i}
              className="nb-cell nb-cell--raw"
              aria-label={`Raw cell ${i + 1}`}
            >
              <span className="nb-cell-index">{i + 1}</span>
              <span className="nb-badge nb-badge--raw">RAW</span>
              <pre className="nb-source">
                {Array.isArray(cell.source) ? cell.source.join('') : cell.source}
              </pre>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default NotebookRenderer
