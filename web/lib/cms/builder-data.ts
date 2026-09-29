import { migrateLegacyBlocks, type ContentBlock } from '@/lib/cms/content-blocks';

/** Исходная секция сайта (сырой HTML) в конструкторе — отдельный тип компонента */
export const SITE_SECTION_TYPE = 'siteSection';

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

export function blocksToBuilderData(blocks: ContentBlock[]): BuilderData {
  const shell = blocks.find((b): b is Extract<ContentBlock, { type: 'shell' }> => b.type === 'shell');
  const body = mergeBlankSections(blocks.filter((b) => b.type !== 'shell'));
  const content = migrateLegacyBlocks(body).map((block) => {
    const { id, type, ...rest } = block;
    const puckType = type === 'html' && (block as { raw?: boolean }).raw ? SITE_SECTION_TYPE : type;
    return { type: puckType, props: { id, ...rest } } as BuilderItem;
  });
  return {
    root: {
      props: {
        shell: shell ? { before: shell.before, mainAttrs: shell.mainAttrs, after: shell.after } : null,
      },
    },
    content,
  };
}

export function builderDataToBlocks(data: {
  root?: { props?: Record<string, unknown> };
  content?: Array<{ type: string; props: Record<string, unknown> }>;
}): ContentBlock[] {
  const out: ContentBlock[] = [];
  const shell = data.root?.props?.shell as ShellProps | null | undefined;
  if (shell) {
    out.push({ id: 'shell', type: 'shell', before: shell.before, mainAttrs: shell.mainAttrs, after: shell.after });
  }
  for (const item of data.content ?? []) {
    const { id, ...rest } = item.props;
    if (item.type === SITE_SECTION_TYPE) {
      out.push({ ...rest, id: String(id), type: 'html', raw: true } as ContentBlock);
    } else {
      out.push({ ...rest, id: String(id), type: item.type } as ContentBlock);
    }
  }
  return out;
}

/** Сравнение без учёта порядка ключей */
export function blocksSignature(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks, (_key, value: unknown) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
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
