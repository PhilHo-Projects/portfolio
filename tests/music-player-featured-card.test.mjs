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
  assert.match(html, /assets\/img\/music-player-v1\.0\.0\.png/);
});

test('offers verified platform downloads and source access', () => {
  assert.match(html, /data-download="windows"/);
  assert.match(html, /MusicPlayer-v1\.0\.0\.zip/);
  assert.match(html, /data-download="macos"/);
  assert.match(html, /MusicPlayer-macos-v1\.0\.0\.zip/);
  assert.match(html, /https:\/\/github\.com\/PhilHo-Projects\/MusicPlayer/);
  assert.match(html, /Unsigned indie build/);
});

test('removes the inaccurate generic Music Player card', () => {
  assert.doesNotMatch(html, /MusicBee-style desktop client/);
  assert.doesNotMatch(html, /Music Player[\s\S]{0,200}Coming soon/);
  assert.match(html, /Song Finder/);
});
