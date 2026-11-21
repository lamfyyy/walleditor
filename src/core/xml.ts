// Мини-парсер XML (элементы, атрибуты, текст). Достаточно для CAML и plist; без внешних зависимостей.
export interface XNode { tag: string; attrs: Record<string, string>; children: XNode[]; text: string }

const unesc = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function parseXml(src: string): XNode {
  const root: XNode = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack: XNode[] = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) {
      if (stack.length > 1) stack.pop();
    } else if (m[2]) {
      const attrs: Record<string, string> = {};
      const ar = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a: RegExpExecArray | null;
      while ((a = ar.exec(m[3] || ''))) attrs[a[1]] = unesc(a[2] ?? a[3] ?? '');
      const node: XNode = { tag: m[2], attrs, children: [], text: '' };
      stack[stack.length - 1].children.push(node);
      if (!m[4]) stack.push(node);
    } else if (m[5] !== undefined) {
      stack[stack.length - 1].text += unesc(m[5]);
    }
  }
  if (root.children.length !== 1) throw new Error('XML: ожидался один корневой элемент');
  return root.children[0];
}

export const child = (n: XNode, tag: string) => n.children.find((c) => c.tag === tag);
export const childrenOf = (n: XNode, tag: string) => n.children.filter((c) => c.tag === tag);
