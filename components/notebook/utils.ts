import type { NotebookCell } from './types'

export function joinSource(source: string | string[] | undefined): string {
  if (!source) return ''
  return Array.isArray(source) ? source.join('') : source
}

const ANSI_REGEX =
  // eslint-disable-next-line no-control-regex
  /\u001b\[[0-9;]*[a-zA-Z]/g

export function stripAnsi(s: string): string {
  return s.replace(ANSI_REGEX, '')
}

/**
 * Map the variety of language identifiers Jupyter/VS Code emit into a
 * shiki-friendly language name. Unknown ids fall back to the input so
 * the caller can decide (usually: fall back to the notebook's language).
 */
const LANG_ALIASES: Record<string, string> = {
  shellscript: 'bash',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  dotenv: 'ini',
  'objective-c': 'objc',
  'objective-cpp': 'objc',
  'c++': 'cpp',
  'c#': 'csharp',
  ipython: 'python',
  ipython3: 'python',
  python3: 'python',
  plaintext: 'text',
}

export function normalizeLanguage(lang: string | undefined | null): string {
  if (!lang) return 'text'
  const key = lang.toLowerCase()
  return LANG_ALIASES[key] ?? key
}

/**
 * Detect per-cell language using, in order:
 *   1. `cell.metadata.vscode.languageId` (set by VS Code's notebook editor)
 *   2. `cell.metadata.language` (generic)
 *   3. Jupyter cell magic on the first non-blank line: `%%bash`, `%%sh`,
 *      `%%javascript`, `%%html`, `%%sql`, `%%r`, `%%script <shell>`
 *   4. `fallback` (usually the notebook-level language).
 */
export function detectCellLanguage(
  cell: NotebookCell,
  fallback: string,
): string {
  const meta = (cell.metadata ?? {}) as Record<string, unknown>
  const vscode = meta.vscode as { languageId?: string } | undefined
  if (vscode?.languageId) return normalizeLanguage(vscode.languageId)
  if (typeof meta.language === 'string') return normalizeLanguage(meta.language)

  const source = joinSource(cell.source).trimStart()
  const firstLine = source.split('\n', 1)[0] ?? ''
  const magic = firstLine.match(/^%%\s*(\w+)(?:\s+(\w+))?/)
  if (magic) {
    const name = magic[1].toLowerCase()
    if (name === 'script' && magic[2]) return normalizeLanguage(magic[2])
    return normalizeLanguage(name)
  }

  return normalizeLanguage(fallback)
}
