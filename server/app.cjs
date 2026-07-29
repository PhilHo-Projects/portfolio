const express = require('express');
const { join } = require('node:path');
const { CvError } = require('./cv-data.cjs');
const { createCvAuth } = require('./cv-auth.cjs');
const { createCvStore } = require('./cv-store.cjs');

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function createPortfolioApp({
  dataDir,
  seedDir,
  distDir,
  password,
  secure,
  authOptions = {},
  storeOptions = {},
}) {
  const app = express();
  const auth = createCvAuth({ password, secure, ...authOptions });
  let managementAvailable = true;
  let store = createCvStore({ dataDir, seedDir, ...storeOptions });

  try {
    store.initialize();
  } catch (error) {
    if (!(error instanceof CvError) || error.code !== 'corrupt_registry') throw error;
    console.warn(`[cv-store] ${error.code}`);
    store = createCvStore({ dataDir: seedDir, seedDir });
    store.initialize();
    managementAvailable = false;
  }

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  function requireManagement(req) {
    if (!managementAvailable) {
      throw new CvError(
        503,
        'cv_store_unavailable',
        'CV editing is temporarily unavailable.',
      );
    }
    auth.requireToken(req.headers.cookie);
  }

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/cvs', (_req, res) => {
    res.json(store.list());
  });

  app.get('/api/cvs/:id', (req, res) => {
    res.json(store.read(req.params.id));
  });

  app.post('/api/cv-editor/login', (req, res) => {
    if (!managementAvailable) {
      throw new CvError(
        503,
        'cv_store_unavailable',
        'CV editing is temporarily unavailable.',
      );
    }
    const result = auth.login(req.ip, req.body?.password);
    res.setHeader('Set-Cookie', result.setCookie);
    res.status(204).end();
  });

  app.post('/api/cv-editor/logout', (req, res) => {
    const result = auth.logout(req.headers.cookie);
    res.setHeader('Set-Cookie', result.setCookie);
    res.status(204).end();
  });

  app.get('/api/cv-editor/session', (req, res) => {
    res.json({
      authenticated: managementAvailable && auth.isAuthenticated(req.headers.cookie),
      available: managementAvailable,
    });
  });

  app.put('/api/cvs/:id', asyncRoute((req, res) => {
    requireManagement(req);
    res.json(store.save(req.params.id, req.body));
  }));

  app.patch('/api/cvs/:id/name', asyncRoute((req, res) => {
    requireManagement(req);
    res.json(store.rename(req.params.id, req.body?.name));
  }));

  app.post('/api/cvs/:id/duplicate', asyncRoute((req, res) => {
    requireManagement(req);
    res.status(201).json(store.duplicate(req.params.id, req.body?.name));
  }));

  app.post('/api/cvs', asyncRoute((req, res) => {
    requireManagement(req);
    res.status(201).json(store.createBlank(req.body?.name));
  }));

  app.get('/api/cvs/:id/backups', asyncRoute((req, res) => {
    requireManagement(req);
    res.json({ backups: store.listBackups(req.params.id) });
  }));

  app.post('/api/cvs/:id/backups/:backupId/restore', asyncRoute((req, res) => {
    requireManagement(req);
    res.json(store.restore(req.params.id, req.params.backupId));
  }));

  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: { code: 'api_route_not_found', message: 'API route not found.' },
    });
  });

  app.get(['/resume', '/resume/'], (_req, res) => {
    res.sendFile(join(distDir, 'resume', 'index.html'));
  });
  app.use(express.static(distDir));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof CvError) {
      res.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
      return;
    }
    if (error?.type === 'entity.too.large' || error?.status === 413) {
      res.status(413).json({
        error: {
          code: 'payload_too_large',
          message: 'Request payload exceeds the 256 KiB limit.',
        },
      });
      return;
    }
    if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
      res.status(400).json({
        error: { code: 'invalid_json', message: 'Request body must be valid JSON.' },
      });
      return;
    }
    console.error('Portfolio request failed:', error?.code || error?.name || 'unknown');
    res.status(500).json({
      error: { code: 'internal_error', message: 'An unexpected error occurred.' },
    });
  });

  return app;
}

module.exports = { createPortfolioApp };
