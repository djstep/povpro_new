'use client';

import { useLayoutEffect } from 'react';

const VISIBLE_ROWS = 4;
const COLLAPSE_PEEK_PX = 14;
const ARTICLE_HEADER = /артикул/i;
const TYPE_HEADER = /тип накладки/i;

type ParamCol = { index: number; label: string };

function parseParamColumns(headers: string[]): ParamCol[] {
  const artIdx = headers.findIndex((h) => ARTICLE_HEADER.test(h));
  if (artIdx < 0) return [];

  const typeIdx = headers.findIndex((h) => TYPE_HEADER.test(h));
  const end = typeIdx >= 0 ? typeIdx : headers.length;

  return headers
    .slice(artIdx + 1, end)
    .map((label, i) => ({ index: artIdx + 1 + i, label: label.trim() }))
    .filter((col) => col.label.length > 0);
}

function matchesParam(cellText: string, filter: string): boolean {
  if (!filter.trim()) return true;
  const cell = cellText.trim();
  const f = filter.trim().replace(',', '.');
  if (!cell) return false;
  if (cell === f) return true;

  const nf = Number.parseFloat(f);
  const nc = Number.parseFloat(cell.replace(',', '.'));
  if (!Number.isNaN(nf) && !Number.isNaN(nc)) return nf === nc;

  return cell.toLowerCase().includes(f.toLowerCase());
}

function getVisibleCount(section: HTMLElement): number {
  const fromItems = Number.parseInt(section.dataset.visibleItems ?? '', 10);
  if (Number.isFinite(fromItems) && fromItems > 0) return fromItems;
  const fromRows = Number.parseInt(section.dataset.visibleRows ?? '', 10);
  if (Number.isFinite(fromRows) && fromRows > 0) return fromRows;
  return VISIBLE_ROWS;
}

function enhanceGridSection(section: HTMLElement): (() => void) | undefined {
  if (section.querySelector('.friction-table-clip')) return undefined;

  const grid = section.querySelector<HTMLElement>('[data-friction-grid]');
  if (!grid) return undefined;

  const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-friction-item]'));
  if (!items.length) return undefined;

  const wrapper = grid.parentElement;
  if (!wrapper) return undefined;

  let expanded = false;
  let searchQuery = '';
  const visibleCount = getVisibleCount(section);

  const searchInput = section.querySelector<HTMLInputElement>('[data-friction-search]');
  const onSearch = () => {
    searchQuery = searchInput?.value.trim() ?? '';
    if (searchQuery) expanded = true;
    update();
  };
  searchInput?.addEventListener('input', onSearch);

  const clip = document.createElement('div');
  clip.className = 'friction-table-clip is-collapsed';

  const fade = document.createElement('div');
  fade.className = 'friction-table-fade';
  fade.setAttribute('aria-hidden', 'true');

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'friction-table-expand';
  toggleBtn.setAttribute('aria-label', 'Развернуть список');
  toggleBtn.innerHTML = `
    <span class="friction-table-expand-line" aria-hidden="true"></span>
    <span class="friction-table-expand-circle">
      <span class="material-symbols-outlined friction-table-expand-icon" aria-hidden="true">keyboard_arrow_down</span>
    </span>
  `;
  toggleBtn.addEventListener('click', () => {
    expanded = !expanded;
    update();
  });

  grid.parentNode?.insertBefore(clip, grid);
  clip.append(grid, fade, toggleBtn);

  function itemMatches(item: HTMLElement): boolean {
    if (!searchQuery) return true;
    const text = item.textContent ?? '';
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  }

  function measureClipHeight(matching: HTMLElement[]): number {
    const count = Math.min(visibleCount, matching.length);
    if (!count) return 0;
    const gridRect = grid!.getBoundingClientRect();
    const last = matching[count - 1]!.getBoundingClientRect();
    return last.bottom - gridRect.top + COLLAPSE_PEEK_PX;
  }

  function update() {
    const matching = items.filter(itemMatches);
    const hasFilter = searchQuery.length > 0;
    const canCollapse = matching.length > visibleCount;

    items.forEach((item) => {
      item.classList.toggle('friction-row-filtered', !matching.includes(item));
    });

    const showExpanded = hasFilter || expanded || !canCollapse;

    clip.classList.toggle('is-collapsed', !showExpanded);
    clip.classList.toggle('is-expanded', showExpanded && canCollapse);

    if (showExpanded) {
      clip.style.maxHeight = '';
    } else {
      clip.style.maxHeight = `${measureClipHeight(matching)}px`;
    }

    fade.hidden = showExpanded;
    toggleBtn.hidden = !canCollapse;
    toggleBtn.setAttribute('aria-expanded', String(showExpanded));
    toggleBtn.setAttribute(
      'aria-label',
      showExpanded ? 'Свернуть список' : 'Развернуть список'
    );
  }

  const ro = new ResizeObserver(() => {
    if (!expanded && !searchQuery) update();
  });
  ro.observe(grid);

  requestAnimationFrame(() => {
    requestAnimationFrame(update);
  });

  section.dataset.frictionReady = 'true';

  return () => {
    ro.disconnect();
    searchInput?.removeEventListener('input', onSearch);
  };
}

function enhanceSection(section: HTMLElement): (() => void) | undefined {
  if (section.dataset.frictionLayout === 'grid' || section.querySelector('[data-friction-grid]')) {
    return enhanceGridSection(section);
  }
  if (section.querySelector('.friction-table-clip')) return undefined;

  const table = section.querySelector('table');
  const tbody = table?.querySelector('tbody');
  const headerCells = table?.querySelectorAll('thead th');
  if (!table || !tbody || !headerCells?.length) return undefined;

  const headers = Array.from(headerCells).map((th) => th.textContent?.trim() ?? '');
  const paramCols = parseParamColumns(headers);
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (!rows.length) return undefined;

  const wrapper = table.closest('.overflow-x-auto') ?? table.parentElement;
  if (!wrapper) return undefined;

  let expanded = false;
  let searchQuery = '';
  const visibleRows = getVisibleCount(section);
  const filters = new Map<number, string>();

  const searchInput = section.querySelector<HTMLInputElement>('[data-friction-search]');
  const onSearch = () => {
    searchQuery = searchInput?.value.trim() ?? '';
    if (searchQuery) expanded = true;
    update();
  };
  searchInput?.addEventListener('input', onSearch);

  const toolbar = document.createElement('div');
  toolbar.className = 'friction-table-toolbar';

  if (paramCols.length) {
    const filtersRow = document.createElement('div');
    filtersRow.className = 'friction-table-filters';

    for (const col of paramCols) {
      const label = document.createElement('label');
      label.className = 'friction-table-filter';

      const span = document.createElement('span');
      span.className = 'friction-table-filter-label';
      span.textContent = col.label;

      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.placeholder = '—';
      input.className = 'friction-table-filter-input';
      input.dataset.colIndex = String(col.index);
      input.addEventListener('input', () => {
        const value = input.value.trim();
        if (value) filters.set(col.index, value);
        else filters.delete(col.index);
        if (filters.size > 0) expanded = true;
        update();
      });

      label.append(span, input);
      filtersRow.appendChild(label);
    }

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'friction-table-reset';
    resetBtn.textContent = 'Сбросить';
    resetBtn.addEventListener('click', () => {
      filters.clear();
      filtersRow.querySelectorAll('input').forEach((el) => {
        (el as HTMLInputElement).value = '';
      });
      expanded = false;
      update();
    });

    filtersRow.appendChild(resetBtn);
    toolbar.appendChild(filtersRow);
  }

  const clip = document.createElement('div');
  clip.className = 'friction-table-clip is-collapsed';

  const fade = document.createElement('div');
  fade.className = 'friction-table-fade';
  fade.setAttribute('aria-hidden', 'true');

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'friction-table-expand';
  toggleBtn.setAttribute('aria-label', 'Развернуть таблицу');
  toggleBtn.innerHTML = `
    <span class="friction-table-expand-line" aria-hidden="true"></span>
    <span class="friction-table-expand-circle">
      <span class="material-symbols-outlined friction-table-expand-icon" aria-hidden="true">keyboard_arrow_down</span>
    </span>
  `;
  toggleBtn.addEventListener('click', () => {
    expanded = !expanded;
    update();
  });

  table.parentNode?.insertBefore(clip, table);
  clip.append(table, fade, toggleBtn);

  function rowMatches(row: HTMLTableRowElement): boolean {
    if (searchQuery) {
      const text = Array.from(row.querySelectorAll('td'))
        .map((cell) => cell.textContent ?? '')
        .join(' ');
      if (!text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    if (!filters.size) return true;
    const cells = row.querySelectorAll('td');
    for (const [colIndex, value] of filters) {
      const cell = cells[colIndex]?.textContent ?? '';
      if (!matchesParam(cell, value)) return false;
    }
    return true;
  }

  function measureClipHeight(matching: HTMLTableRowElement[]): number {
    const thead = table!.querySelector('thead');
    let height = thead?.getBoundingClientRect().height ?? 0;
    const visible = Math.min(visibleRows, matching.length);
    for (let i = 0; i < visible; i++) {
      height += matching[i].getBoundingClientRect().height;
    }
    return height + COLLAPSE_PEEK_PX;
  }

  function update() {
    const matching = rows.filter(rowMatches);
    const hasFilter = filters.size > 0;
    const canCollapse = matching.length > visibleRows;

    rows.forEach((row) => {
      row.classList.toggle('friction-row-filtered', !matching.includes(row));
    });

    const showExpanded = hasFilter || expanded || !canCollapse;

    clip.classList.toggle('is-collapsed', !showExpanded);
    clip.classList.toggle('is-expanded', showExpanded && canCollapse);

    if (showExpanded) {
      clip.style.maxHeight = '';
    } else {
      clip.style.maxHeight = `${measureClipHeight(matching)}px`;
    }

    fade.hidden = showExpanded;
    toggleBtn.hidden = !canCollapse;
    toggleBtn.setAttribute('aria-expanded', String(showExpanded));
    toggleBtn.setAttribute(
      'aria-label',
      showExpanded ? 'Свернуть таблицу' : 'Развернуть таблицу'
    );

    const countEl = section.querySelector('.friction-table-match-count');
    if (hasFilter) {
      const text =
        matching.length === 0
          ? 'Ничего не найдено'
          : `Найдено: ${matching.length}`;
      if (countEl) countEl.textContent = text;
      else {
        const el = document.createElement('p');
        el.className = 'friction-table-match-count';
        el.textContent = text;
        toolbar.appendChild(el);
      }
    } else if (countEl) {
      countEl.remove();
    }
  }

  const note = wrapper.querySelector('p.text-on-surface-variant');
  const schema = wrapper.querySelector('.friction-table-schema');
  const toolbarAnchor = schema?.nextElementSibling ?? note?.nextElementSibling ?? clip;
  wrapper.insertBefore(toolbar, toolbarAnchor);

  const ro = new ResizeObserver(() => {
    if (!expanded && filters.size === 0) update();
  });
  ro.observe(table);

  requestAnimationFrame(() => {
    requestAnimationFrame(update);
  });

  section.dataset.frictionReady = 'true';

  return () => {
    ro.disconnect();
    searchInput?.removeEventListener('input', onSearch);
  };
}

function enhanceAllTables(): Array<() => void> {
  const root = document.querySelector('.site-content');
  if (!root) return [];

  const sections = root.querySelectorAll<HTMLElement>('main section.glass-panel');
  const cleanups: Array<() => void> = [];
  sections.forEach((section) => {
    const cleanup = enhanceSection(section);
    if (cleanup) cleanups.push(cleanup);
  });
  return cleanups;
}

export function FrictionTablesEnhancer() {
  useLayoutEffect(() => {
    let cleanups: Array<() => void> = [];
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      cleanups.forEach((fn) => fn());
      cleanups = enhanceAllTables();
    };

    run();

    const retries = [50, 150, 400].map((ms) => setTimeout(run, ms));

    const root = document.querySelector('.site-content');
    const observer =
      root &&
      new MutationObserver(() => {
        const pending = root.querySelectorAll('main section.glass-panel:not([data-friction-ready])');
        if (pending.length) run();
      });

    if (observer && root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      retries.forEach(clearTimeout);
      observer?.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
