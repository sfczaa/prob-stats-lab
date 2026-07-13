import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Render a LaTeX string with KaTeX. `block` gives display mode on its own line. */
export default function TeX({ tex, block = false }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: false }),
    [tex],
  )
  return (
    <span
      className={block ? 'block overflow-x-auto overflow-y-hidden py-1' : ''}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
