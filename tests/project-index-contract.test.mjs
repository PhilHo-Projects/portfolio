import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const build = spawnSync('npm', ['run', 'build'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

const richProjectIds = [
  'chatroomwars',
  'turboreader',
  'manga-tracker',
  'chatsim',
  'personal-soundcloud',
  'mp3-maker',
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
  const ids = ['chatroomwars', 'unreal-engine-5', 'billing-hub', 'job-scraper', 'music-player', 'song-finder'];
  for (const id of ids) {
    assert.match(html, new RegExp(`data-project-trigger="${id}"`));
    assert.match(html, new RegExp(`aria-controls="project-detail-${id}"`));
    assert.match(html, new RegExp(`id="project-detail-${id}"`));
  }
  assert.doesNotMatch(html, /aria-expanded="true"/);
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
  assert.match(projectDetail('mp3-maker'), /SoundCloud and Bandcamp/);
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
