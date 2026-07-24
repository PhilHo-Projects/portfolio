import { gridColumnCount, projectRowEndIndex } from './project-grid-layout.js';

const grids = [...document.querySelectorAll<HTMLElement>('[data-project-grid]')];
let activeId: string | null = null;
let activeTrigger: HTMLButtonElement | null = null;

const details = () => [...document.querySelectorAll<HTMLElement>('[data-project-detail]')];

function hide(detail: HTMLElement): void {
  detail.hidden = true;
  detail.classList.remove('opacity-100', 'translate-y-0');
  detail.classList.add('opacity-0', 'translate-y-2');
}

function place(detail: HTMLElement, trigger: HTMLButtonElement): void {
  const grid = trigger.closest<HTMLElement>('[data-project-grid]');
  if (!grid) return;
  const tiles = [...grid.querySelectorAll<HTMLButtonElement>('[data-project-trigger]')];
  const triggerIndex = tiles.indexOf(trigger);
  if (triggerIndex === -1) return;
  const columns = gridColumnCount(getComputedStyle(grid).gridTemplateColumns);
  const lastTile = tiles[projectRowEndIndex(triggerIndex, columns, tiles.length)];
  if (lastTile) lastTile.insertAdjacentElement('afterend', detail);
}

function show(detail: HTMLElement, trigger: HTMLButtonElement): void {
  place(detail, trigger);
  detail.hidden = false;
  requestAnimationFrame(() => {
    detail.classList.remove('opacity-0', 'translate-y-2');
    detail.classList.add('opacity-100', 'translate-y-0');
  });
}

function closeActive(restoreFocus = true): void {
  if (!activeId) return;
  const detail = document.querySelector<HTMLElement>(`[data-project-detail="${activeId}"]`);
  if (detail) hide(detail);
  activeTrigger?.setAttribute('aria-expanded', 'false');
  const trigger = activeTrigger;
  activeId = null;
  activeTrigger = null;
  if (restoreFocus) trigger?.focus();
}

function openProject(trigger: HTMLButtonElement): void {
  const id = trigger.dataset.projectTrigger;
  if (!id) return;
  if (activeId === id) {
    closeActive();
    return;
  }
  closeActive(false);
  const detail = document.querySelector<HTMLElement>(`[data-project-detail="${id}"]`);
  if (!detail) return;
  activeId = id;
  activeTrigger = trigger;
  trigger.setAttribute('aria-expanded', 'true');
  show(detail, trigger);
  const rect = trigger.getBoundingClientRect();
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    trigger.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

document.addEventListener('click', (event) => {
  const trigger = (event.target as Element).closest<HTMLButtonElement>('[data-project-trigger]');
  if (trigger) openProject(trigger);
  const collapse = (event.target as Element).closest<HTMLButtonElement>('[data-collapse-project]');
  if (collapse) closeActive();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeId) closeActive();
});

let resizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (activeId && activeTrigger) {
      const detail = document.querySelector<HTMLElement>(`[data-project-detail="${activeId}"]`);
      if (detail) place(detail, activeTrigger);
    }
  });
});

details().forEach(hide);
void grids;
