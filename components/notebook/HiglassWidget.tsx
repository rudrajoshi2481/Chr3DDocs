'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  /** A HiGlass viewconf object (the full `_viewconf` from `higlass-python`). */
  viewconf: unknown
  /** Optional `higlass` plugin script URLs to inject before viewer init. */
  pluginUrls?: string[]
  /** Iframe height in pixels. Defaults to 540. */
  height?: number
  /** Pin a specific `higlass` version on esm.sh. */
  higlassVersion?: string
}

/**
 * Renders a static HiGlass widget inside a sandboxed iframe using the
 * `_viewconf` captured in the notebook's `metadata.widgets` state. We inject
 * the viewer via `srcdoc` so each widget is fully self-contained and
 * isolated from the host page (no React/version conflicts).
 */
export function HiglassWidget({
  viewconf,
  pluginUrls = [],
  height = 540,
  higlassVersion = '2.2.3',
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  // Re-mount the iframe if any of these change.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const srcDoc = useMemo(
    () => buildSrcDoc({ viewconf, pluginUrls, higlassVersion }),
    [viewconf, pluginUrls, higlassVersion],
  )

  return (
    <div
      className="nb-output nb-output--higlass"
      style={{ height }}
      role="figure"
      aria-label="HiGlass widget"
    >
      {mounted ? (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="HiGlass widget"
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            border: '0',
            display: 'block',
          }}
          // sandbox is omitted on purpose: HiGlass needs network access to
          // tile servers, and we control the srcdoc content ourselves.
        />
      ) : (
        <div className="nb-output--higlass-placeholder">
          Loading HiGlass viewer…
        </div>
      )}
    </div>
  )
}

function buildSrcDoc({
  viewconf,
  pluginUrls,
  higlassVersion,
}: {
  viewconf: unknown
  pluginUrls: string[]
  higlassVersion: string
}): string {
  const safeViewconf = JSON.stringify(viewconf ?? {}).replace(/</g, '\\u003c')
  const safePluginUrls = JSON.stringify(pluginUrls ?? []).replace(
    /</g,
    '\\u003c',
  )
  const esmUrl = `https://esm.sh/higlass@${higlassVersion}?deps=react@17,react-dom@17,pixi.js@6`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: transparent; }
  #root { height: 100%; width: 100%; }
  .hg-error {
    font: 13px/1.5 ui-sans-serif, system-ui, sans-serif;
    color: #b91c1c;
    padding: 12px 14px;
  }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
  const VIEWCONF = ${safeViewconf};
  const PLUGIN_URLS = ${safePluginUrls};

  function loadScript(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + href + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = href; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + href));
      document.head.appendChild(s);
    });
  }

  try {
    const hglib = await import(${JSON.stringify(esmUrl)});
    if (hglib.CSS) {
      const sheet = document.createElement('style');
      sheet.textContent = hglib.CSS;
      document.head.appendChild(sheet);
    }
    // Some higlass plugins are legacy AMD/UMD; load them after disabling
    // RequireJS-style globals so they register on the window cleanly.
    const backup = { define: window.define, require: window.require, requirejs: window.requirejs };
    for (const k of Object.keys(backup)) window[k] = undefined;
    await Promise.allSettled(PLUGIN_URLS.map(loadScript));
    Object.assign(window, backup);

    hglib.viewer(document.getElementById('root'), VIEWCONF, {
      bounded: true,
    });
  } catch (err) {
    const el = document.getElementById('root');
    el.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'hg-error';
    msg.textContent = 'HiGlass widget failed to load: ' + (err && err.message ? err.message : String(err));
    el.appendChild(msg);
    console.error(err);
  }
</script>
</body>
</html>`
}

export default HiglassWidget
