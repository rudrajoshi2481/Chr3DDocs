export interface NotebookOutputBase {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error'
  metadata?: Record<string, unknown>
}

export interface StreamOutput extends NotebookOutputBase {
  output_type: 'stream'
  name: 'stdout' | 'stderr'
  text: string | string[]
}

export interface DataOutput extends NotebookOutputBase {
  output_type: 'execute_result' | 'display_data'
  execution_count?: number | null
  data: {
    'text/plain'?: string | string[]
    'text/html'?: string | string[]
    'image/png'?: string
    'image/jpeg'?: string
    'image/svg+xml'?: string | string[]
    'application/json'?: unknown
    'text/markdown'?: string | string[]
    [k: string]: unknown
  }
}

export interface ErrorOutput extends NotebookOutputBase {
  output_type: 'error'
  ename: string
  evalue: string
  traceback: string[]
}

export type NotebookOutput = StreamOutput | DataOutput | ErrorOutput

export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw'
  source: string | string[]
  metadata?: Record<string, unknown>
  execution_count?: number | null
  outputs?: NotebookOutput[]
}

/** Single entry in the notebook's `metadata.widgets` widget-state map. */
export interface WidgetStateEntry {
  model_module?: string
  model_name?: string
  model_module_version?: string
  state: Record<string, unknown> & {
    _anywidget_id?: string
    _viewconf?: unknown
    _plugin_urls?: string[]
  }
}

/** Map of model_id -> widget state, as produced by ipywidgets/anywidget. */
export type WidgetStateMap = Record<string, WidgetStateEntry>

export interface Notebook {
  cells: NotebookCell[]
  metadata: {
    kernelspec?: { name: string; language: string; display_name: string }
    language_info?: { name: string; version?: string }
    widgets?: {
      'application/vnd.jupyter.widget-state+json'?: {
        state?: WidgetStateMap
      } & WidgetStateMap
    }
  }
  nbformat: number
  nbformat_minor: number
}
