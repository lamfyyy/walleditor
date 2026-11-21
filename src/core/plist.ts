import { esc, parseXml, XNode } from './xml';

export type PVal = string | number | boolean | PVal[] | { [k: string]: PVal } & object;
export type PDict = { [k: string]: PVal };
export class PReal { constructor(public v: number) {} }

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n';

function ser(v: unknown, ind: string): string {
  if (v instanceof PReal) return `${ind}<real>${v.v}</real>\n`;
  if (typeof v === 'string') return `${ind}<string>${esc(v)}</string>\n`;
  if (typeof v === 'boolean') return `${ind}<${v ? 'true' : 'false'}/>\n`;
  if (typeof v === 'number') return Number.isInteger(v) ? `${ind}<integer>${v}</integer>\n` : `${ind}<real>${v}</real>\n`;
  if (Array.isArray(v)) return `${ind}<array>\n${v.map((x) => ser(x, ind + '\t')).join('')}${ind}</array>\n`;
  if (v && typeof v === 'object') {
    const keys = Object.keys(v as object);
    return `${ind}<dict>\n${keys.map((k) => `${ind}\t<key>${esc(k)}</key>\n${ser((v as any)[k], ind + '\t')}`).join('')}${ind}</dict>\n`;
  }
  throw new Error('plist: неподдерживаемый тип');
}

export const writePlist = (d: PDict): string => HEAD + ser(d, '') + '</plist>\n';

function val(n: XNode): PVal {
  switch (n.tag) {
    case 'string': return n.text;
    case 'integer': return parseInt(n.text, 10);
    case 'real': return parseFloat(n.text);
    case 'true': return true;
    case 'false': return false;
    case 'array': return n.children.map(val);
    case 'dict': {
      const o: PDict = {};
      for (let i = 0; i < n.children.length; i += 2) o[n.children[i].text] = val(n.children[i + 1]);
      return o;
    }
    case 'data': case 'date': return n.text.trim();
    default: throw new Error('plist: неизвестный тег ' + n.tag);
  }
}

/** Читает XML-plist. Бинарные plist (bplist00) не поддерживаются — вызывающий код покажет предупреждение. */
export function readPlist(src: string): PDict {
  if (src.startsWith('bplist')) throw new Error('binary-plist');
  const root = parseXml(src);
  if (root.tag !== 'plist') throw new Error('plist: нет корня <plist>');
  return val(root.children[0]) as PDict;
}
