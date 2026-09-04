import {
  MONTHS,
  addDays,
  calendarGrid,
  compact,
  full,
  levelOf,
  monthLabels,
  quantileCuts,
} from './heatmap.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const PAD_L = 22;
const PAD_T = 16;

// Portfolio accent at rising opacity, over the page's own dark ground. Level 0
// is a faint well rather than nothing, so quiet days still read as days.
const LEVEL_FILL = [
  'rgb(255 255 255 / 0.06)',
  'color-mix(in srgb, var(--color-accent) 22%, transparent)',
  'color-mix(in srgb, var(--color-accent) 42%, transparent)',
  'color-mix(in srgb, var(--color-accent) 68%, transparent)',
  'var(--color-accent)',
];

/**
 * @param {number[]} days
 * @param {string} from
 * @param {Document} doc
 * @returns {SVGSVGElement}
 */
function buildHeatmap(days, from, doc) {
  const end = addDays(from, days.length - 1);
  const byDate = new Map(days.map((v, i) => [addDays(from, i), v]));
  const grid = calendarGrid(end);
  const cuts = quantileCuts(days);

  const width = PAD_L + grid.length * STEP;
  const height = PAD_T + 7 * STEP;

  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  // Fills a wide card instead of leaving dead space, but keeps its intrinsic
  // width as a floor so a phone scrolls the grid horizontally rather than
  // shrinking the cells into illegibility. The parent supplies overflow-x.
  svg.setAttribute('width', '100%');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Daily token activity over the last year');
  svg.setAttribute('class', 'h-auto block');
  svg.style.minWidth = `${width}px`;

  for (const { col, label } of monthLabels(grid)) {
    const text = doc.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(PAD_L + col * STEP));
    text.setAttribute('y', '10');
    text.setAttribute('fill', 'currentColor');
    text.setAttribute('font-size', '9');
    text.setAttribute('class', 'font-mono opacity-50');
    text.textContent = label;
    svg.appendChild(text);
  }

  grid.forEach((column, x) => {
    column.forEach((date, y) => {
      if (date === null) return;
      const value = byDate.get(date) ?? 0;
      const rect = doc.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(PAD_L + x * STEP));
      rect.setAttribute('y', String(PAD_T + y * STEP));
      rect.setAttribute('width', String(CELL));
      rect.setAttribute('height', String(CELL));
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', LEVEL_FILL[levelOf(value, cuts)]);
      // Read back by the delegated tooltip listener. Deliberately not a native
      // <title>: that needs a second of steady hovering and renders as an
      // unstyled OS bubble most people never notice.
      rect.dataset.date = date;
      rect.dataset.value = String(value);
      svg.appendChild(rect);
    });
  });

  return svg;
}

/**
 * "2026-09-04" -> "Sep 4, 2026". Parsed from the string rather than through
 * Date, which reads a bare date as UTC midnight and renders the previous day
 * for anyone west of GMT.
 *
 * @param {string} date
 * @returns {string}
 */
function formatDay(date) {
  const [y, m, d] = date.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

/**
 * One delegated listener on the SVG rather than 365 per-cell ones.
 *
 * @param {SVGSVGElement} svg
 * @param {HTMLElement} card  positioning context; must not clip overflow
 * @param {HTMLElement} tip
 */
function attachTooltip(svg, card, tip) {
  const hide = () => {
    tip.hidden = true;
  };

  const show = (event, cell) => {
    const value = Number(cell.dataset.value);
    const day = formatDay(cell.dataset.date);
    tip.textContent = value > 0 ? `${day} · ${compact(value)} tokens` : `${day} · quiet`;
    // Unhide before measuring: a display:none element has no width.
    tip.hidden = false;

    const box = card.getBoundingClientRect();
    const x = Math.min(
      Math.max(event.clientX - box.left + 12, 8),
      Math.max(8, box.width - tip.offsetWidth - 8),
    );
    let y = event.clientY - box.top - tip.offsetHeight - 10;
    // Flip below the cursor rather than escaping the top of the card.
    if (y < 4) y = event.clientY - box.top + 18;

    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };

  const onPoint = (event) => {
    const cell = event.target;
    if (cell instanceof Element && cell.tagName === 'rect' && cell.dataset.date) {
      show(event, cell);
    } else {
      hide();
    }
  };

  svg.addEventListener('pointermove', onPoint);
  // Touch has no hover state, so the tap itself is the whole interaction.
  svg.addEventListener('pointerdown', onPoint);
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('pointercancel', hide);
}

/**
 * Paint a summary into the section. Exported separately from the fetch so it
 * can be exercised without a network or a live server.
 *
 * @param {HTMLElement} root
 * @param {object} summary
 * @param {Document} [doc]
 */
export function renderActivity(root, summary, doc = root.ownerDocument) {
  const set = (name, value) => {
    const node = root.querySelector(`[data-activity="${name}"]`);
    if (node) node.textContent = value;
  };

  set('total', compact(summary.totals.raw));
  set('measured', `${full(summary.totals.raw)} measured · ${summary.totals.activeDays} active days`);

  for (const { tool, raw, sessions } of summary.tools) {
    set(`${tool}-raw`, compact(raw));
    set(`${tool}-sessions`, `${sessions} session${sessions === 1 ? '' : 's'}`);
  }

  set('input', compact(summary.totals.input));
  set('output', compact(summary.totals.output));
  set('reasoning', `incl. ${compact(summary.totals.reasoning)} reasoning`);
  set('cache-read', compact(summary.totals.cacheRead));
  set('fresh-input', compact(summary.totals.freshInput));

  const host = root.querySelector('[data-activity="heatmap"]');
  if (host) {
    const svg = buildHeatmap(summary.days, summary.from, doc);
    host.replaceChildren(svg);

    const card = root.querySelector('[data-activity="heatmap-card"]');
    const tip = root.querySelector('[data-activity="tooltip"]');
    if (card && tip) attachTooltip(svg, card, tip);
  }

  root.hidden = false;
}
