'use client';

import { useEffect } from 'react';
import { useGetPuck } from '@puckeditor/core';
import {
  FREE_TYPES,
  Guides,
  SNAP_PX,
  componentEl,
  frameZoom,
  originOf,
  round2,
  updateItemProps,
  type GuideLine,
} from '@/components/admin/builder/FreeDrag';
import { isDims, isPlace, type Dims } from '@/lib/cms/elements';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const ALL_DIRS: Dir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const FLOW_DIRS: Dir[] = ['e', 'se', 's'];
const CURSORS: Record<Dir, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};
const HANDLE_COLOR = '#2f7bff';
const HANDLE_PX = 9;
const MIN_PX = 8;

/** Типы, у которых меняется только ширина (высота следует за ней или не имеет смысла) */
const WIDTH_ONLY = new Set(['elDivider', 'elIcon']);
const KEEP_RATIO = new Set(['elIcon']);

/** Что именно тянем: у кнопки, плашки, иконки, фото и линии — сам видимый элемент внутри обёртки */
function sizeTarget(root: HTMLElement): HTMLElement {
  if (!root.classList.contains('cmsx-place')) return root;
  return (
    root.querySelector<HTMLElement>(
      ':scope > .cmsx-btn, :scope > .cmsx-badge, :scope > .cmsx-icon, :scope > .cmsx-media, :scope > .cmsx-hr',
    ) ?? root
  );
}

type Edge = { v: number; a: number; b: number };
type Size = { v: number; rect: DOMRect };

/** Края соседей и контейнера (координаты окна холста) и размеры соседей — к ним примагничиваемся */
function collectSnaps(doc: Document, root: HTMLElement) {
  const x: Edge[] = [];
  const y: Edge[] = [];
  const widths: Size[] = [];
  const heights: Size[] = [];
  const parent = root.parentElement;
  if (parent) {
    const o = originOf(parent);
    const style = doc.defaultView?.getComputedStyle(parent);
    const pl = parseFloat(style?.paddingLeft ?? '0') || 0;
    const pr = parseFloat(style?.paddingRight ?? '0') || 0;
    const pt = parseFloat(style?.paddingTop ?? '0') || 0;
    const pb = parseFloat(style?.paddingBottom ?? '0') || 0;
    for (const v of new Set([0, pl, o.width / 2, o.width - pr, o.width])) x.push({ v: o.left + v, a: o.top, b: o.top + o.height });
    for (const v of new Set([0, pt, o.height / 2, o.height - pb, o.height])) y.push({ v: o.top + v, a: o.left, b: o.left + o.width });
  }
  const scope = parent?.closest('section') ?? parent ?? doc.body;
  const nodes = Array.from(scope.querySelectorAll<HTMLElement>('[data-puck-component]')).slice(0, 400);
  for (const node of nodes) {
    if (node === root || node.contains(root) || root.contains(node)) continue;
    const r = sizeTarget(node).getBoundingClientRect();
    if (!r.width || !r.height) continue;
    for (const v of [r.left, r.left + r.width / 2, r.right]) x.push({ v, a: r.top, b: r.bottom });
    for (const v of [r.top, r.top + r.height / 2, r.bottom]) y.push({ v, a: r.left, b: r.right });
    widths.push({ v: r.width, rect: r });
    heights.push({ v: r.height, rect: r });
  }
  return { x, y, widths, heights };
}

function nearest<T extends { v: number }>(value: number, list: T[], threshold: number): T | null {
  let best: T | null = null;
  for (const item of list) {
    const d = Math.abs(item.v - value);
    if (d <= threshold && (!best || d < Math.abs(best.v - value))) best = item;
  }
  return best;
}

/**
 * Рамка с уголками у выбранного элемента: тянем — меняется ширина/высота (свойство dims).
 * Края примагничиваются к краям соседей, размер — к размерам соседей; Shift — пропорции, Alt — без магнитов.
 */
export function useResizeHandles(doc: Document | undefined, id: string, type: string) {
  const getPuck = useGetPuck();

  useEffect(() => {
    const win = doc?.defaultView;
    if (!doc || !win || !id || !FREE_TYPES.has(type)) return;

    const overlay = doc.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;';
    const frame = doc.createElement('div');
    frame.style.cssText = `position:fixed;left:0;top:0;border:1px solid ${HANDLE_COLOR};pointer-events:none;box-sizing:border-box;`;
    overlay.appendChild(frame);
    const handles = new Map<Dir, HTMLDivElement>();
    for (const dir of ALL_DIRS) {
      const h = doc.createElement('div');
      h.dataset.cmsResize = dir;
      h.style.cssText = `position:fixed;left:0;top:0;background:#fff;border:1.5px solid ${HANDLE_COLOR};border-radius:2px;box-sizing:border-box;pointer-events:auto;cursor:${CURSORS[dir]};touch-action:none;`;
      overlay.appendChild(h);
      handles.set(dir, h);
    }
    doc.body.appendChild(overlay);

    let raf = 0;

    const visibleDirs = (root: HTMLElement): Dir[] => {
      const free = root.classList.contains('cmsx-free') && win.getComputedStyle(root).position === 'absolute';
      const dirs = free ? ALL_DIRS : FLOW_DIRS;
      return WIDTH_ONLY.has(type) ? dirs.filter((d) => d === 'e' || d === 'w' || (KEEP_RATIO.has(type) && d.length === 2)) : dirs;
    };

    const layout = () => {
      raf = win.requestAnimationFrame(layout);
      const root = componentEl(doc, id);
      const r = root ? sizeTarget(root).getBoundingClientRect() : null;
      if (!root || !r || (!r.width && !r.height)) {
        overlay.style.display = 'none';
        return;
      }
      overlay.style.display = '';
      frame.style.transform = `translate(${r.left}px,${r.top}px)`;
      frame.style.width = `${r.width}px`;
      frame.style.height = `${r.height}px`;
      const size = HANDLE_PX / frameZoom(doc);
      const dirs = visibleDirs(root);
      for (const [dir, h] of handles) {
        if (!dirs.includes(dir)) {
          h.style.display = 'none';
          continue;
        }
        const x = dir.includes('w') ? r.left : dir.includes('e') ? r.right : r.left + r.width / 2;
        const y = dir.includes('n') ? r.top : dir.includes('s') ? r.bottom : r.top + r.height / 2;
        h.style.display = '';
        h.style.width = `${size}px`;
        h.style.height = `${size}px`;
        h.style.transform = `translate(${x - size / 2}px,${y - size / 2}px)`;
      }
    };
    raf = win.requestAnimationFrame(layout);

    const swallow = (e: Event) => {
      if ((e.target as HTMLElement | null)?.dataset?.cmsResize) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const dir = (e.target as HTMLElement | null)?.dataset?.cmsResize as Dir | undefined;
      if (!dir || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const root = componentEl(doc, id);
      if (!root) return;
      const target = sizeTarget(root);
      const start = target.getBoundingClientRect();
      const rootStart = root.getBoundingClientRect();
      const free = root.classList.contains('cmsx-free') && win.getComputedStyle(root).position === 'absolute';
      const origin = free && root.parentElement ? originOf(root.parentElement) : null;
      const snaps = collectSnaps(doc, root);
      const threshold = SNAP_PX / frameZoom(doc);
      const ratio = start.width / (start.height || 1);
      const changesW = dir.includes('e') || dir.includes('w');
      const changesH = !WIDTH_ONLY.has(type) && (dir.includes('n') || dir.includes('s'));
      const guides = new Guides(doc);
      let moved = false;
      let box = { left: start.left, top: start.top, right: start.right, bottom: start.bottom };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        moved = true;
        const b = { left: start.left, top: start.top, right: start.right, bottom: start.bottom };
        if (dir.includes('e')) b.right = Math.max(b.left + MIN_PX, b.right + dx);
        if (dir.includes('w')) b.left = Math.min(b.right - MIN_PX, b.left + dx);
        if (changesH && dir.includes('s')) b.bottom = Math.max(b.top + MIN_PX, b.bottom + dy);
        if (changesH && dir.includes('n')) b.top = Math.min(b.bottom - MIN_PX, b.top + dy);

        const lines: GuideLine[] = [];
        let note = '';
        if (!ev.altKey) {
          if (changesW) {
            const side = dir.includes('e') ? 'right' : 'left';
            const edge = nearest(b[side], snaps.x, threshold);
            const same = edge ? null : nearest(b.right - b.left, snaps.widths, threshold);
            if (edge) {
              b[side] = edge.v;
              lines.push({ axis: 'x', at: edge.v, from: Math.min(b.top, edge.a), to: Math.max(b.bottom, edge.b) });
            } else if (same) {
              if (side === 'right') b.right = b.left + same.v;
              else b.left = b.right - same.v;
              note = ' = ширина соседа';
              lines.push({ axis: 'y', at: same.rect.bottom + 4, from: same.rect.left, to: same.rect.right });
              lines.push({ axis: 'y', at: b.bottom + 4, from: b.left, to: b.right });
            }
          }
          if (changesH) {
            const side = dir.includes('s') ? 'bottom' : 'top';
            const edge = nearest(b[side], snaps.y, threshold);
            const same = edge ? null : nearest(b.bottom - b.top, snaps.heights, threshold);
            if (edge) {
              b[side] = edge.v;
              lines.push({ axis: 'y', at: edge.v, from: Math.min(b.left, edge.a), to: Math.max(b.right, edge.b) });
            } else if (same) {
              if (side === 'bottom') b.bottom = b.top + same.v;
              else b.top = b.bottom - same.v;
              note += note ? ', высота' : ' = высота соседа';
              lines.push({ axis: 'x', at: same.rect.right + 4, from: same.rect.top, to: same.rect.bottom });
              lines.push({ axis: 'x', at: b.right + 4, from: b.top, to: b.bottom });
            }
          }
        }
        if ((ev.shiftKey || KEEP_RATIO.has(type)) && dir.length === 2 && !WIDTH_ONLY.has(type)) {
          const w = b.right - b.left;
          const h = w / ratio;
          if (dir.includes('s')) b.bottom = b.top + h;
          else b.top = b.bottom - h;
        }
        box = b;

        const w = Math.round(b.right - b.left);
        const h = Math.round(b.bottom - b.top);
        if (changesW) {
          root.classList.add('cmsx-dw');
          root.style.setProperty('--cmsx-w', `${w}px`);
        }
        if (changesH) {
          root.classList.add('cmsx-dh');
          root.style.setProperty('--cmsx-h', `${h}px`);
        }
        if (origin) {
          root.style.left = `${round2(((rootStart.left + (b.left - start.left) - origin.left) / origin.width) * 100)}%`;
          root.style.top = `${Math.round(rootStart.top + (b.top - start.top) - origin.top)}px`;
        }
        const label = WIDTH_ONLY.has(type) ? `${w}px` : `${w} × ${h}`;
        guides.draw(lines, `${label}${note}`, b.left, b.top);
      };

      const finish = () => {
        doc.removeEventListener('pointermove', onMove, true);
        doc.removeEventListener('pointerup', finish, true);
        doc.removeEventListener('pointercancel', finish, true);
        guides.remove();
        if (!moved) return;
        const item = getPuck().getItemById(id);
        const prev: Dims = isDims(item?.props.dims) ? item.props.dims : {};
        const dims: Dims = { ...prev };
        if (changesW) dims.w = Math.round(box.right - box.left);
        if (changesH) dims.h = Math.round(box.bottom - box.top);
        const patch: Record<string, unknown> = { dims };
        const place = item?.props.place;
        if (origin && isPlace(place)) {
          patch.place = {
            ...place,
            x: round2(((rootStart.left + (box.left - start.left) - origin.left) / origin.width) * 100),
            y: Math.round(rootStart.top + (box.top - start.top) - origin.top),
          };
        }
        updateItemProps(getPuck, id, patch);
      };

      doc.addEventListener('pointermove', onMove, true);
      doc.addEventListener('pointerup', finish, true);
      doc.addEventListener('pointercancel', finish, true);
    };

    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('mousedown', swallow, true);
    doc.addEventListener('click', swallow, true);
    return () => {
      win.cancelAnimationFrame(raf);
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('mousedown', swallow, true);
      doc.removeEventListener('click', swallow, true);
      overlay.remove();
    };
  }, [doc, getPuck, id, type]);
}
