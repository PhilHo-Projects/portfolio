const { join } = require('node:path');
const { createPortfolioApp } = require('./server/app.cjs');

const rootDir = __dirname;
const port = Number(process.env.PORT || 8080);
const dataDir = process.env.CV_DATA_DIR || join(rootDir, 'runtime', 'cv');
const activityDir = process.env.ACTIVITY_DIR;
const seedDir = join(rootDir, 'public', 'data', 'resumes');
const distDir = join(rootDir, 'dist');
const password = process.env.CV_EDITOR_PASSWORD || '0000';
const secure =
  process.env.CV_COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production';

const app = createPortfolioApp({
  dataDir,
  seedDir,
  distDir,
  password,
  secure,
  activityDir,
});

app.listen(port, '::', () => {
  console.log(`Portfolio listening on port ${port}`);
});
