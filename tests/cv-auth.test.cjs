const assert = require('node:assert/strict');
const test = require('node:test');
const { CvError } = require('../server/cv-data.cjs');
const { createCvAuth } = require('../server/cv-auth.cjs');

function makeAuth(overrides = {}) {
  let timestamp = Date.UTC(2026, 6, 29, 12);
  let tokenIndex = 0;
  const auth = createCvAuth({
    password: '0000',
    secure: false,
    now: () => timestamp,
    tokenFactory: () => `test-token-${tokenIndex++}`,
    ...overrides,
  });
  return {
    auth,
    advance(milliseconds) {
      timestamp += milliseconds;
    },
  };
}

test('accepts only the configured password and returns an HttpOnly cookie', () => {
  const { auth } = makeAuth({ tokenFactory: () => 'test-token' });
  assert.throws(() => auth.login('127.0.0.1', 'wrong'), /Incorrect editor password/);
  const result = auth.login('127.0.0.1', '0000');
  assert.match(result.setCookie, /^cv_editor_session=test-token;/);
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /SameSite=Strict/);
  assert.equal(auth.isAuthenticated(result.setCookie), true);
});

test('adds Secure only when configured for HTTPS', () => {
  const insecure = makeAuth().auth.login('127.0.0.1', '0000').setCookie;
  const secure = makeAuth({ secure: true }).auth.login('127.0.0.1', '0000').setCookie;
  assert.doesNotMatch(insecure, /; Secure/);
  assert.match(secure, /; Secure/);
});

test('rate limits the fifth failed attempt within fifteen minutes', () => {
  const { auth } = makeAuth();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.throws(
      () => auth.login('203.0.113.5', 'wrong'),
      (error) => error instanceof CvError && error.code === 'invalid_editor_password',
    );
  }
  assert.throws(
    () => auth.login('203.0.113.5', 'wrong'),
    (error) => error instanceof CvError && error.status === 429 && error.code === 'login_rate_limited',
  );
});

test('successful login clears failures for that address', () => {
  const { auth } = makeAuth();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.throws(() => auth.login('203.0.113.8', 'wrong'));
  }
  auth.login('203.0.113.8', '0000');
  assert.throws(
    () => auth.login('203.0.113.8', 'wrong'),
    (error) => error instanceof CvError && error.code === 'invalid_editor_password',
  );
});

test('expires sessions after two hours of inactivity', () => {
  const { auth, advance } = makeAuth();
  const { setCookie } = auth.login('127.0.0.1', '0000');
  advance(2 * 60 * 60 * 1000 + 1);
  assert.equal(auth.isAuthenticated(setCookie), false);
  assert.throws(
    () => auth.requireToken(setCookie),
    (error) => error instanceof CvError && error.code === 'editor_session_required',
  );
});

test('logout invalidates the token and clears the cookie', () => {
  const { auth } = makeAuth();
  const { setCookie } = auth.login('127.0.0.1', '0000');
  const result = auth.logout(setCookie);
  assert.match(result.setCookie, /^cv_editor_session=;/);
  assert.match(result.setCookie, /Max-Age=0/);
  assert.equal(auth.isAuthenticated(setCookie), false);
});

test('missing and malformed cookies are unauthenticated', () => {
  const { auth } = makeAuth();
  for (const cookie of [undefined, '', 'other=value', 'cv_editor_session', 'cv_editor_session=']) {
    assert.equal(auth.isAuthenticated(cookie), false);
  }
});

test('clears failed attempts after the throttle window', () => {
  const { auth, advance } = makeAuth();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.throws(() => auth.login('198.51.100.4', 'wrong'));
  }
  advance(15 * 60 * 1000 + 1);
  assert.throws(
    () => auth.login('198.51.100.4', 'wrong'),
    (error) => error instanceof CvError && error.code === 'invalid_editor_password',
  );
});
