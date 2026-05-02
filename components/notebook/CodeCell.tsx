import { codeToHtml, type BundledLanguage, type BundledTheme } from 'shiki'
import { CopyButton } from './CopyButton'
import { HiglassWidget } from './HiglassWidget'
import { HtmlFrame } from './HtmlFrame'
import { detectCellLanguage, joinSource, stripAnsi } from './utils'
import type {
  DataOutput,
  ErrorOutput,
  NotebookCell,
  StreamOutput,
  WidgetStateMap,
} from './types'

interface Props {
  cell: NotebookCell
  /** Notebook-level language fallback (e.g. "python"). */
  language: string
  index: number
  lightTheme?: BundledTheme
  darkTheme?: BundledTheme
  /** Notebook-wide widget state, keyed by `model_id`. */
  widgetState?: WidgetStateMap
}

const DEFAULT_LIGHT: BundledTheme = 'github-light'
const DEFAULT_DARK: BundledTheme = 'github-dark'

async function highlight(
  code: string,
  lang: string,
  light: BundledTheme,
  dark: BundledTheme,
): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: lang as BundledLanguage,
      themes: { light, dark },
      defaultColor: false,
    })
  } catch {
    // Unsupported language — fall back to plain text so we still highlight
    // nothing but keep the same wrapper markup.
    return await codeToHtml(code, {
      lang: 'text' as BundledLanguage,
      themes: { light, dark },
      defaultColor: false,
    })
  }
}

export async function CodeCell({
  cell,
  language,
  index,
  lightTheme = DEFAULT_LIGHT,
  darkTheme = DEFAULT_DARK,
  widgetState,
}: Props) {
  const source = joinSource(cell.source)
  const cellLang = detectCellLanguage(cell, language)
  const highlighted = await highlight(source, cellLang, lightTheme, darkTheme)

  const execLabel =
    cell.execution_count == null ? ' ' : String(cell.execution_count)

  return (
    <section className="nb-cell nb-cell--code" aria-label={`Code cell ${index + 1}`}>
      <span className="nb-prompt">
        In&nbsp;[<span className="nb-prompt-num">{execLabel}</span>]
      </span>
      <div className="nb-cell-actions">
        <CopyButton text={source} />
        <span className="nb-badge nb-badge--lang" aria-label={cellLang}>
          {cellLang}
        </span>
      </div>
      <div
        className="nb-source"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      {cell.outputs && cell.outputs.length > 0 && (
        <div className="nb-outputs">
          {cell.outputs.map((out, i) => (
            <OutputRenderer key={i} output={out} widgetState={widgetState} />
          ))}
        </div>
      )}
    </section>
  )
}

function OutputRenderer({
  output,
  widgetState,
}: {
  output: StreamOutput | DataOutput | ErrorOutput
  widgetState?: WidgetStateMap
}) {
  if (output.output_type === 'stream') {
    const text = joinSource(output.text)
    const isErr = output.name === 'stderr'
    return (
      <pre
        className={
          'nb-output nb-output--stream ' +
          (isErr ? 'nb-output--stderr' : 'nb-output--stdout')
        }
      >
        {text}
      </pre>
    )
  }

  if (output.output_type === 'error') {
    const text = output.traceback.map(stripAnsi).join('\n')
    return (
      <pre className="nb-output nb-output--error">
        <span className="nb-error-name">{output.ename}</span>
        {output.evalue ? ': ' + output.evalue : ''}
        {'\n'}
        {text}
      </pre>
    )
  }

  const data = output.data ?? {}

  // Jupyter widget views — look up the captured viewconf in the notebook's
  // widget state and render rich widgets we know about (HiGlass for now).
  const widgetView = data['application/vnd.jupyter.widget-view+json'] as
    | { model_id?: string }
    | undefined
  if (widgetView && typeof widgetView.model_id === 'string') {
    const entry = widgetState?.[widgetView.model_id]
    const state = entry?.state
    if (state?._anywidget_id === 'higlass._widget.HiGlassWidget' && state._viewconf) {
      return (
        <HiglassWidget
          viewconf={state._viewconf}
          pluginUrls={Array.isArray(state._plugin_urls) ? state._plugin_urls : []}
        />
      )
    }
    // Widget view without usable state — show a clear diagnostic instead of
    // silently falling through to the opaque `<Widget object at 0x…>` repr.
    return (
      <div className="nb-output nb-output--widget-missing" role="note">
        <strong>Widget output not rendered.</strong>
        <div className="nb-output--widget-missing-hint">
          {!widgetState || Object.keys(widgetState).length === 0
            ? 'This notebook has no `metadata.widgets` state — re-save it in JupyterLab with "Save Notebook Widget State" so the viewconf is embedded.'
            : `No widget state found for model_id "${widgetView.model_id}". The notebook's saved widget state may be out of sync with this cell's output.`}
        </div>
      </div>
    )
  }

  if (typeof data['image/png'] === 'string') {
    return (
      <div className="nb-output nb-output--image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="cell output"
          src={'data:image/png;base64,' + data['image/png']}
        />
      </div>
    )
  }

  if (typeof data['image/jpeg'] === 'string') {
    return (
      <div className="nb-output nb-output--image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="cell output"
          src={'data:image/jpeg;base64,' + data['image/jpeg']}
        />
      </div>
    )
  }

  if (data['image/svg+xml']) {
    const svg = joinSource(data['image/svg+xml'] as string | string[])
    return (
      <div
        className="nb-output nb-output--svg"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    )
  }

  if (data['text/html']) {
    const html = joinSource(data['text/html'] as string | string[])
    // Full HTML documents (e.g. HiGlass/Bokeh standalone exports) must be
    // rendered inside an iframe — injecting `<!DOCTYPE>`/`<html>`/`<head>`
    // into a `<div>` causes the browser parser to strip those tags, which
    // produces a React hydration mismatch vs. the SSR'd string.
    if (isFullHtmlDocument(html)) {
      return <HtmlFrame html={html} />
    }
    return (
      <div
        className="nb-output nb-output--html"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  if (data['text/markdown']) {
    return (
      <pre className="nb-output nb-output--text">
        {joinSource(data['text/markdown'] as string | string[])}
      </pre>
    )
  }

  if (data['application/json'] !== undefined) {
    return (
      <pre className="nb-output nb-output--json">
        {JSON.stringify(data['application/json'], null, 2)}
      </pre>
    )
  }

  if (data['text/plain']) {
    return (
      <pre className="nb-output nb-output--text">
        {joinSource(data['text/plain'] as string | string[])}
      </pre>
    )
  }

  return null
}

function isFullHtmlDocument(html: string): boolean {
  // Match a leading DOCTYPE or `<html ...>` (after optional whitespace/BOM/comments).
  return /^\s*(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+html|<html[\s>])/i.test(html)
}
