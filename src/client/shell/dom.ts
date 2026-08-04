// Tiny DOM helpers shared by the shell and its chrome components.
//
// The shell builds every node it owns, so the two things it needs are a
// query that fails loudly when a container is missing from index.html and an
// element factory that keeps the builders readable. Nothing here knows what a
// window is — see `window-frame.ts` and `window-manager.ts` for that.

/** The container `sel` names, or a hard failure — index.html is a contract. */
export function must<E extends Element = HTMLElement>(sel: string, root: ParentNode = document): E {
  const node = root.querySelector<E>(sel)
  if (!node) throw new Error(`shell: index.html is missing '${sel}'`)
  return node
}

/** `document.createElement` with the class and text set in one call. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className !== undefined) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** A real `<button type="button">` with an accessible name — never a div. */
export function button(className: string, label: string, text: string): HTMLButtonElement {
  const node = el('button', className, text)
  node.type = 'button'
  node.title = label
  return node
}
