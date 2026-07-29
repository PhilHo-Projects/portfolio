const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const { CvError } = require('./cv-data.cjs');

const COOKIE_NAME = 'cv_editor_session';
const DEFAULT_IDLE_MS = 2 * 60 * 60 * 1000;
const DEFAULT_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

function digest(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : '').digest();
}

function constantTimeEqual(left, right) {
  return timingSafeEqual(digest(left), digest(right));
}

function cookieToken(cookieHeader) {
  if (typeof cookieHeader !== 'string') return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name === COOKIE_NAME && value) return value;
  }
  return null;
}

function createCvAuth({
  password,
  secure = false,
  now = () => Date.now(),
  tokenFactory = () => randomBytes(32).toString('hex'),
  idleMs = DEFAULT_IDLE_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  attemptWindowMs = DEFAULT_ATTEMPT_WINDOW_MS,
}) {
  const sessions = new Map();
  const failures = new Map();
  const maxAge = Math.floor(idleMs / 1000);

  function serializeCookie(token, age = maxAge) {
    const parts = [
      `${COOKIE_NAME}=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${age}`,
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
  }

  function recentFailures(ip, timestamp) {
    const attempts = (failures.get(ip) || []).filter(
      (attemptedAt) => timestamp - attemptedAt < attemptWindowMs,
    );
    if (attempts.length) failures.set(ip, attempts);
    else failures.delete(ip);
    return attempts;
  }

  function login(ip, candidate) {
    const timestamp = now();
    const address = typeof ip === 'string' && ip ? ip : 'unknown';
    const attempts = recentFailures(address, timestamp);
    if (attempts.length >= maxAttempts) {
      throw new CvError(
        429,
        'login_rate_limited',
        'Too many login attempts. Try again later.',
      );
    }

    if (!constantTimeEqual(password, candidate)) {
      attempts.push(timestamp);
      failures.set(address, attempts);
      if (attempts.length >= maxAttempts) {
        throw new CvError(
          429,
          'login_rate_limited',
          'Too many login attempts. Try again later.',
        );
      }
      throw new CvError(401, 'invalid_editor_password', 'Incorrect editor password.');
    }

    failures.delete(address);
    let token = tokenFactory();
    while (sessions.has(token)) token = tokenFactory();
    sessions.set(token, { lastSeen: timestamp });
    return { token, setCookie: serializeCookie(token) };
  }

  function clearExpired() {
    const timestamp = now();
    for (const [token, session] of sessions) {
      if (timestamp - session.lastSeen > idleMs) sessions.delete(token);
    }
  }

  function requireToken(cookieHeader) {
    clearExpired();
    const token = cookieToken(cookieHeader);
    const session = token ? sessions.get(token) : null;
    if (!session) {
      throw new CvError(401, 'editor_session_required', 'Editor session required.');
    }
    session.lastSeen = now();
    return token;
  }

  function isAuthenticated(cookieHeader) {
    try {
      requireToken(cookieHeader);
      return true;
    } catch {
      return false;
    }
  }

  function logout(cookieHeader) {
    const token = cookieToken(cookieHeader);
    if (token) sessions.delete(token);
    return { setCookie: serializeCookie('', 0) };
  }

  return {
    login,
    logout,
    isAuthenticated,
    requireToken,
    clearExpired,
  };
}

module.exports = {
  COOKIE_NAME,
  createCvAuth,
};
