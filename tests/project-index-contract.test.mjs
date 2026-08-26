import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const build = spawnSync('npm', ['run', 'build'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

const richProjectIds = [
  'hidden',
  'turboreader',
  'manga-tracker',
  'chatsim',
  'personal-soundcloud',
  'wave-function-collapse',
  'classaction-scanner',
];

function projectDetail(id) {
  const start = html.indexOf(`id="project-detail-${id}"`);
  assert.notEqual(start, -1, `Missing detail panel for ${id}`);
  const nextTrigger = html.indexOf('data-project-trigger=', start);
  return html.slice(start, nextTrigger === -1 ? html.length : nextTrigger);
}

test('renders every project as a collapsed expandable index item', () => {
  const ids = ['hidden', 'unreal-engine-5', 'billing-hub', 'job-scraper', 'music-player', 'song-finder'];
  for (const id of ids) {
    assert.match(html, new RegExp(`data-project-trigger="${id}"`));
    assert.match(html, new RegExp(`aria-controls="project-detail-${id}"`));
    assert.match(html, new RegExp(`id="project-detail-${id}"`));
  }
  assert.doesNotMatch(html, /aria-expanded="true"/);
});

test('renders Web Development before Game Development', () => {
  const webDevelopment = html.indexOf('id="web-development"');
  const gameDevelopment = html.indexOf('id="game-development"');

  assert.notEqual(webDevelopment, -1);
  assert.notEqual(gameDevelopment, -1);
  assert.ok(webDevelopment < gameDevelopment);
});

test('keeps the unfinished MP3 utility hidden from the built page', () => {
  assert.doesNotMatch(html, /data-project-trigger="mp3-maker"/);
  assert.doesNotMatch(html, /id="project-detail-mp3-maker"/);
});

test('presents CloudSound as the live self-hosted audio platform', () => {
  const detail = projectDetail('personal-soundcloud');
  const cardStart = html.indexOf('data-project-trigger="personal-soundcloud"');
  const card = html.slice(cardStart, html.indexOf('</button>', cardStart));

  assert.notEqual(cardStart, -1);
  assert.match(card, /Live demo/);
  assert.match(card, /CloudSound/);
  assert.match(card, /Self-hosted Audio Platform/);
  assert.match(card, /public listening.*approved member uploads.*resumable R2 storage.*custom waveform player/);
  assert.match(detail, /React · TypeScript · Fastify · SQLite · Cloudflare R2/);
  assert.match(detail, /assets\/img\/cloudsound\.webp/);
  assert.match(detail, /alt="CloudSound public set library with search, layout, and sorting controls"/);
  assert.ok(existsSync(new URL('../public/assets/img/cloudsound.webp', import.meta.url)));
  assert.match(detail, /Direct-to-R2 uploads/);
  assert.match(detail, /Approved accounts/);
  assert.match(detail, /Custom playback/);
  assert.match(
    detail,
    /href="https:\/\/cloudsound\.philippeho\.dev"[^>]+target="_blank"[^>]+rel="noreferrer"/,
  );
});

test('shows Coming soon only for projects with that explicit status', () => {
  const card = (id) => {
    const start = html.indexOf(`data-project-trigger="${id}"`);
    assert.notEqual(start, -1, `Missing card for ${id}`);
    return html.slice(start, html.indexOf('</button>', start));
  };

  assert.doesNotMatch(card('unreal-engine-5'), /Coming soon/);
  assert.match(card('song-finder'), /Coming soon/);
});

test('presents Hidden as the current live browser strategy game', () => {
  const detail = projectDetail('hidden');

  assert.match(html, /data-project-trigger="hidden"/);
  assert.match(detail, /Blind-board Strategy Game/);
  assert.match(detail, /React · TypeScript · WebSocket · PostgreSQL/);
  assert.match(detail, /assets\/img\/hidden-gameplay\.webp/);
  assert.match(detail, /Blind-board tactics/);
  assert.match(detail, /Online and offline play/);
  assert.match(detail, /Production account backend/);
  assert.match(
    detail,
    /href="https:\/\/hidden\.philippeho\.dev"[^>]+target="_blank"[^>]+rel="noreferrer"/,
  );

  assert.doesNotMatch(html, /ChatroomWars|Unity WebGL|\/hiddengame\//);
});

test('removes the legacy project modal and iframe surface', () => {
  assert.doesNotMatch(html, /project-modal|project-iframe|iframe-container|carousel-container/);
  assert.doesNotMatch(html, /openProjectModal|openImageModal|openCertificateModal/);
  assert.doesNotMatch(html, /ClassAction Scanner[\s\S]{0,500}Live demo/);
  assert.doesNotMatch(html, /<iframe\b/);
});

test('keeps external detail actions safe', () => {
  const externalLinks = [...html.matchAll(/<a[^>]+target="_blank"[^>]*>/g)].map(([link]) => link).filter(link => /href="https?:/.test(link));
  for (const link of externalLinks) assert.match(link, /rel="noreferrer"/);
});

test('gives every finished standard project a screenshot-led proof panel', () => {
  for (const id of richProjectIds) {
    const detail = projectDetail(id);
    assert.match(detail, new RegExp(`data-rich-project="${id}"`));
    assert.match(detail, new RegExp(`data-project-preview="${id}"`));
    assert.match(detail, /<img[^>]+width="1280"[^>]+height="720"[^>]+loading="lazy"[^>]+decoding="async"/);
    assert.equal((detail.match(/data-project-highlight/g) ?? []).length, 3, `${id} should have three highlights`);
    assert.match(detail, /<a[^>]+href="https?:[^>]+target="_blank"[^>]+rel="noreferrer"/);
  }
});

test('keeps Song Finder as the unfinished text-only exception', () => {
  const detail = projectDetail('song-finder');
  assert.match(detail, /Coming soon/);
  assert.doesNotMatch(detail, /data-rich-project|data-project-preview|<img\b|Open project/);
});

test('keeps status and compact copy aligned with the live implementations', () => {
  assert.match(html, /Public demo/);
  assert.match(projectDetail('classaction-scanner'), /Under construction/);
  assert.match(projectDetail('classaction-scanner'), /Open working preview/);
  assert.doesNotMatch(html, /YouTube, Bandcamp, and SoundCloud/);
});

test('renders three linked Unreal Engine coursework visuals without expiring claims', () => {
  assert.equal((html.match(/data-coursework-card/g) ?? []).length, 3);
  for (const image of ['ue5-multiplayer-shooter.webp', 'ue5-ultimate-course.webp', 'ue5-dedicated-servers.webp']) {
    assert.match(html, new RegExp(`assets/img/${image}`));
  }
  for (const href of [
    'https://www.udemy.com/course/unreal-engine-5-cpp-multiplayer-shooter/',
    'https://www.udemy.com/course/unreal-engine-5-the-ultimate-game-developer-course/',
    'https://www.udemy.com/course/unreal-engine-5-dedicated-servers-with-aws-and-gamelift/',
  ]) {
    assert.match(html, new RegExp(`href="${href}"`));
  }
  assert.doesNotMatch(html, /couponCode=|Certifications &amp; Coursework|\bcertification\b/i);
});
