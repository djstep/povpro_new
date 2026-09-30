import { migrateLegacyBlocks, type ContentBlock } from '@/lib/cms/content-blocks';
import { SLOT_PROPS } from '@/lib/cms/elements';
import { decomposeSiteSection } from '@/lib/cms/html-tree';

/** Исходная секция сайта (сырой HTML) в конструкторе — отдельный тип компонента */
export const SITE_SECTION_TYPE = 'siteSection';
/** Элемент внутри разобранной секции сайта (тоже сырой HTML) */
export const SITE_FRAGMENT_TYPE = 'siteFragment';

export type ShellProps = { before: string; mainAttrs: string; after: string };

export type BuilderItem = { type: string; props: Record<string, unknown> & { id: string } };

export type BuilderData = {
  root: { props: { shell?: ShellProps | null } };
  content: BuilderItem[];
};

function isBlankHtml(html: string): boolean {
  return !html.replace(/<!--[\s\S]*?-->/g, '').trim();
}

/** Фрагменты импорта только из комментариев/пробелов приклеиваются к соседней секции — пустых блоков на холсте нет */
function mergeBlankSections(blocks: ContentBlock[]): ContentBlock[] {
  const out: ContentBlock[] = [];
  let pending = '';
  for (const block of blocks) {
    if (block.type === 'html' && block.raw && isBlankHtml(block.content)) {
      pending += block.content;
      continue;
    }
    if (pending && block.type === 'html' && block.raw) {
      out.push({ ...block, content: pending + block.content });
      pending = '';
      continue;
    }
    out.push(block);
  }
  if (pending) {
    const last = out[out.length - 1];
    if (last?.type === 'html' && last.raw) out[out.length - 1] = { ...last, content: last.content + pending };
  }
  return out;
}

/** Цельная секция сайта → контейнер с отдельными элементами (вёрстка та же), если разметка позволяет */
function splitSiteSection(block: ContentBlock): ContentBlock {
  if (block.type !== 'html' || !block.raw) return block;
  return decomposeSiteSection(block.content, block.id, block.label) ?? block;
}

function blockToItem(block: ContentBlock, nested: boolean): BuilderItem {
  const { id, type, ...rest } = block as ContentBlock & Record<string, unknown>;
  const raw = type === 'html' && (block as { raw?: boolean }).raw;
  const props: Record<string, unknown> & { id: string } = { id, ...rest };
  if (raw) delete props.raw;
  for (const slot of SLOT_PROPS[type] ?? []) {
    const children = (rest as Record<string, unknown>)[slot];
    props[slot] = Array.isArray(children) ? (children as ContentBlock[]).map((c) => blockToItem(c, true)) : [];
  }
  return { type: raw ? (nested ? SITE_FRAGMENT_TYPE : SITE_SECTION_TYPE) : type, props };
}

export function blocksToBuilderData(blocks: ContentBlock[]): BuilderData {
  const shell = blocks.find((b): b is Extract<ContentBlock, { type: 'shell' }> => b.type === 'shell');
  const body = mergeBlankSections(blocks.filter((b) => b.type !== 'shell'));
  return {
    root: {
      props: {
        shell: shell ? { before: shell.before, mainAttrs: shell.mainAttrs, after: shell.after } : null,
      },
    },
    content: migrateLegacyBlocks(body)
      .map(splitSiteSection)
      .map((block) => blockToItem(block, false)),
  };
}

type RawItem = { type: string; props: Record<string, unknown> };

function itemToBlock(item: RawItem): ContentBlock {
  const { id, ...rest } = item.props;
  const raw = item.type === SITE_SECTION_TYPE || item.type === SITE_FRAGMENT_TYPE;
  const type = raw ? 'html' : item.type;
  const block: Record<string, unknown> = { ...rest, id: String(id), type };
  if (raw) block.raw = true;
  for (const slot of SLOT_PROPS[type] ?? []) {
    const children = rest[slot];
    block[slot] = Array.isArray(children) ? (children as RawItem[]).map(itemToBlock) : [];
  }
  return block as unknown as ContentBlock;
}

export function builderDataToBlocks(data: {
  root?: { props?: Record<string, unknown> };
  content?: RawItem[];
}): ContentBlock[] {
  const out: ContentBlock[] = [];
  const shell = data.root?.props?.shell as ShellProps | null | undefined;
  if (shell) {
    out.push({ id: 'shell', type: 'shell', before: shell.before, mainAttrs: shell.mainAttrs, after: shell.after });
  }
  for (const item of data.content ?? []) out.push(itemToBlock(item));
  return out;
}

/** Сравнение по содержимому: без учёта порядка ключей и id блоков */
export function blocksSignature(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks, (key, value: unknown) => {
    if (key === 'id') return undefined;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([k, v]) => v !== undefined && k !== 'id')
          .sort(([a], [b]) => a.localeCompare(b)),
      );
    }
    return value;
  });
}

/** class="…" из атрибутов <main> оболочки страницы */
export function mainClassFromAttrs(attrs: string | undefined): string | null {
  if (!attrs) return null;
  const m = attrs.match(/\bclass=(["'])(.*?)\1/i);
  return m ? m[2] : '';
}
