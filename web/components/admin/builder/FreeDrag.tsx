'use client';

import { useEffect } from 'react';
import { useGetPuck } from '@puckeditor/core';
import { SITE_FRAGMENT_TYPE } from '@/lib/cms/builder-data';
import { ELEMENT_TYPES, isPlace, type Place } from '@/lib/cms/elements';

/** Компоненты конструктора, которые можно размещать свободно */
export const FREE_TYPES = new Set<string>([...ELEMENT_TYPES, 'box', SITE_FRAGMENT_TYPE]);

export type GetPuck = ReturnType<typeof useGetPuck>;

/** Порог примагничивания в экранных пикселях */
export const SNAP_PX = 6;
const GUIDE_COLOR = '#ff2fb3';

export function canvasDocument(): Document | null {
  const frame = document.querySelector('#preview-frame');
  return frame instanceof HTMLIFrameElement ? frame.contentDocument : null;
}

export function componentEl(doc: Document, id: string): HTMLElement | null {
  return doc.querySelector<HTMLElement>(`[data-puck-component="${CSS.escape(id)}"]`);
}

/** Верхний левый угол и размер области, от которой считаются left/top (padding-box родителя) */
export function originOf(parent: HTMLElement) {
  const r = parent.getBoundingClientRect();
  return {
    left: r.left + parent.clientLeft,
    top: r.top + parent.clientTop,
    width: parent.clientWidth || r.width,
    height: parent.clientHeight || r.height,
  };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Текущее положение элемента на холсте — чтобы при включении свободного режима он не прыгал */
export function measurePlace(id: string, mobile: Place['mobile'] = 'flow'): Place {
  const doc = canvasDocument();
  const el = doc ? componentEl(doc, id) : null;
  const parent = el?.parentElement;
  if (!el || !parent) return { x: 0, y: 0, mobile };
  const o = originOf(parent);
  const r = el.getBoundingClientRect();
  return { x: round2(((r.left - o.left) / o.width) * 100), y: Math.round(r.top - o.top), mobile };
}

export function updatePlace(getPuck: GetPuck, id: string, place: Place | undefined) {
  updateItemProps(getPuck, id, { place });
}

/** Меняет свойства элемента без смены id; undefined — удалить свойство */
export function updateItemProps(getPuck: GetPuck, id: string, patch: Record<string, unknown>) {
  const puck = getPuck();
  const item = puck.getItemById(id);
  const selector = puck.getSelectorForId(id);
  if (!item || !selector) return;
  const props: Record<string, unknown> = { ...item.props };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete props[key];
    else props[key] = value;
  }
  puck.dispatch({
    type: 'replace',
    destinationIndex: selector.index,
    destinationZone: selector.zone,
    data: { ...item, props } as typeof item,
  });
}

type Target = { v: number; a: number; b: number };
type Targets = { x: Target[]; y: Target[] };

/** Края и центры контейнера и соседних элементов — к ним примагничиваемся */
function collectTargets(doc: Document, el: HTMLElement, parent: HTMLElement, o: ReturnType<typeof originOf>): Targets {
  const x: Target[] = [];
  const y: Target[] = [];
  const style = doc.defaultView?.getComputedStyle(parent);
  const pl = parseFloat(style?.paddingLeft ?? '0') || 0;
  const pr = parseFloat(style?.paddingRight ?? '0') || 0;
  const pt = parseFloat(style?.paddingTop ?? '0') || 0;
  const pb = parseFloat(style?.paddingBottom ?? '0') || 0;
  for (const v of new Set([0, pl, o.width / 2, o.width - pr, o.width])) x.push({ v, a: 0, b: o.height });
  for (const v of new Set([0, pt, o.height / 2, o.height - pb, o.height])) y.push({ v, a: 0, b: o.width });

  const scope = parent.closest('section') ?? parent;
  const nodes = Array.from(scope.querySelectorAll<HTMLElement>('[data-puck-component]')).slice(0, 400);
  for (const node of nodes) {
    if (node === el || node.contains(el) || el.contains(node)) continue;
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const left = r.left - o.left;
    const top = r.top - o.top;
    for (const v of [left, left + r.width / 2, left + r.width]) x.push({ v, a: top, b: top + r.height });
    for (const v of [top, top + r.height / 2, top + r.height]) y.push({ v, a: left, b: left + r.width });
  }
  return { x, y };
}

/** Ближайшее совпадение одного из краёв/центра элемента с целью */
function snapAxis(pos: number, size: number, targets: Target[], threshold: number) {
  const edges = [pos, pos + size / 2, pos + size];
  let best: { d: number; v: number } | null = null;
  for (const t of targets) {
    for (const e of edges) {
      const d = t.v - e;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v: t.v };
    }
  }
  return best;
}

export function frameZoom(doc: Document): number {
  const frame = doc.defaultView?.frameElement as HTMLElement | null | undefined;
  const inner = doc.documentElement.clientWidth;
  if (!frame || !inner) return 1;
  return frame.getBoundingClientRect().width / inner || 1;
}

export type GuideLine = { axis: 'x' | 'y'; at: number; from: number; to: number };

export class Guides {
  private root: HTMLDivElement;
  private label: HTMLDivElement;

  constructor(private doc: Document) {
    this.root = doc.createElement('div');
    this.root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
    this.label = doc.createElement('div');
    this.label.style.cssText = `position:fixed;padding:2px 6px;border-radius:4px;background:${GUIDE_COLOR};color:#fff;font:600 11px/1.4 system-ui,sans-serif;white-space:nowrap;`;
    doc.body.appendChild(this.root);
  }

  draw(lines: GuideLine[], text: string, labelX: number, labelY: number) {
    this.root.replaceChildren();
    for (const line of lines) {
      const div = this.doc.createElement('div');
      const len = Math.max(1, line.to - line.from);
      div.style.cssText =
        line.axis === 'x'
          ? `position:fixed;left:${line.at}px;top:${line.from}px;width:1px;height:${len}px;background:${GUIDE_COLOR};`
          : `position:fixed;top:${line.at}px;left:${line.from}px;height:1px;width:${len}px;background:${GUIDE_COLOR};`;
      this.root.appendChild(div);
    }
    this.label.textContent = text;
    this.label.style.left = `${labelX}px`;
    this.label.style.top = `${Math.max(0, labelY - 22)}px`;
    this.root.appendChild(this.label);
  }

  remove() {
    this.root.remove();
  }
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/**
 * Свободное перетаскивание на холсте: элементы с классом cmsx-free двигаются мышью с примагничиванием
 * к краям и центрам соседей (Alt — без примагничивания, Shift — по одной оси), стрелки — сдвиг на 1px (Shift — 10px).
 */
export function useFreeDrag(doc: Document | undefined) {
  const getPuck = useGetPuck();

  useEffect(() => {
    const win = doc?.defaultView;
    if (!doc || !win) return;

    const isFreeNow = (el: HTMLElement) =>
      el.classList.contains('cmsx-free') && win.getComputedStyle(el).position === 'absolute';

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>('[data-puck-component]');
      if (!el || !isFreeNow(el)) return;
      const id = el.getAttribute('data-puck-component');
      const parent = el.parentElement;
      if (!id || !parent) return;

      e.stopPropagation();
      const puck = getPuck();
      const selector = puck.getSelectorForId(id);
      if (selector) puck.dispatch({ type: 'setUi', ui: { itemSelector: selector } });

      const o = originOf(parent);
      const r = el.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, left: r.left - o.left, top: r.top - o.top };
      const targets = collectTargets(doc, el, parent, o);
      const threshold = SNAP_PX / frameZoom(doc);
      const original = { left: el.style.left, top: el.style.top };
      const guides = new Guides(doc);
      let left = start.left;
      let top = start.top;
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        let dx = ev.clientX - start.x;
        let dy = ev.clientY - start.y;
        if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        moved = true;
        if (ev.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        left = start.left + dx;
        top = start.top + dy;
        const lines: { axis: 'x' | 'y'; at: number; from: number; to: number }[] = [];
        if (!ev.altKey) {
          const sx = snapAxis(left, r.width, targets.x, threshold);
          if (sx) left += sx.d;
          const sy = snapAxis(top, r.height, targets.y, threshold);
          if (sy) top += sy.d;
          if (sx) {
            const hits = targets.x.filter((t) => Math.abs(t.v - sx.v) < 0.5);
            const from = Math.min(top, ...hits.map((t) => t.a));
            const to = Math.max(top + r.height, ...hits.map((t) => t.b));
            lines.push({ axis: 'x', at: o.left + sx.v, from: o.top + from, to: o.top + to });
          }
          if (sy) {
            const hits = targets.y.filter((t) => Math.abs(t.v - sy.v) < 0.5);
            const from = Math.min(left, ...hits.map((t) => t.a));
            const to = Math.max(left + r.width, ...hits.map((t) => t.b));
            lines.push({ axis: 'y', at: o.top + sy.v, from: o.left + from, to: o.left + to });
          }
        }
        el.style.left = `${round2((left / o.width) * 100)}%`;
        el.style.top = `${Math.round(top)}px`;
        guides.draw(lines, `x ${round2((left / o.width) * 100)}%  ·  y ${Math.round(top)}px`, o.left + left, o.top + top);
      };

      const finish = () => {
        doc.removeEventListener('pointermove', onMove, true);
        doc.removeEventListener('pointerup', finish, true);
        doc.removeEventListener('pointercancel', finish, true);
        guides.remove();
        if (!moved) {
          el.style.left = original.left;
          el.style.top = original.top;
          return;
        }
        const current = getPuck().getItemById(id)?.props.place;
        updatePlace(getPuck, id, {
          x: round2((left / o.width) * 100),
          y: Math.round(top),
          mobile: isPlace(current) ? current.mobile : 'flow',
        });
      };

      doc.addEventListener('pointermove', onMove, true);
      doc.addEventListener('pointerup', finish, true);
      doc.addEventListener('pointercancel', finish, true);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.key.startsWith('Arrow') || isTyping(e.target)) return;
      const puck = getPuck();
      const item = puck.selectedItem;
      const place = item?.props.place;
      if (!item || !isPlace(place)) return;
      const id = String(item.props.id);
      const el = componentEl(doc, id);
      const parent = el?.parentElement;
      if (!el || !parent || !isFreeNow(el)) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const width = originOf(parent).width || 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      updatePlace(getPuck, id, { ...place, x: round2(place.x + (dx / width) * 100), y: Math.round(place.y + dy) });
    };

    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('keydown', onKeyDown);
    window.document.addEventListener('keydown', onKeyDown);
    return () => {
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('keydown', onKeyDown);
      window.document.removeEventListener('keydown', onKeyDown);
    };
  }, [doc, getPuck]);
}
