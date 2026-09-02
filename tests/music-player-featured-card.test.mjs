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

test('renders MusicPlayer as a released featured native app', () => {
  assert.match(html, /data-featured-project="music-player"/);
  assert.match(html, /data-feature-layout="stacked"/);
  assert.match(html, /Native DJ-focused audio player/);
  assert.match(html, /10-band EQ/);
  assert.match(html, /Traktor/);
  // Fingerprinted by Astro rather than served from `public/`, so replacing the
  // screenshot can't leave browsers on a cached copy of the old one.
  assert.match(html, /\/_astro\/music-player-v1\.0\.0\.[\w-]+\.png/);
});

test('offers verified platform downloads and source access', () => {
  assert.match(html, /data-download="windows"[^>]*class="[^"]*min-h-11/);
  assert.match(html, /MusicPlayer-v1\.0\.0\.zip/);
  assert.match(html, /data-download="macos"[^>]*class="[^"]*min-h-11/);
  assert.match(html, /MusicPlayer-macos-v1\.0\.0\.zip/);
  assert.match(html, /href="https:\/\/github\.com\/PhilHo-Projects\/MusicPlayer"[^>]*>[\s\S]*?View source/);
  assert.match(html, /data-secondary-action="source"[^>]*class="[^"]*min-h-11/);
  assert.match(html, /data-secondary-action="release"[^>]*class="[^"]*min-h-11/);
  assert.match(html, /data-build-warning[^>]*class="[^"]*text-slate-400/);
  assert.match(html, /Unsigned indie build/);
});

test('removes the inaccurate generic Music Player card', () => {
  assert.doesNotMatch(html, /MusicBee-style desktop client/);
  assert.doesNotMatch(html, /<h4[^>]*>Rust Music Player<\/h4>/);
  assert.match(html, /Song Finder/);
});
