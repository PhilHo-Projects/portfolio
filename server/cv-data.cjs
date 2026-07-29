class CvError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'CvError';
    this.status = status;
    this.code = code;
  }
}

function normalizeDisplayName(input) {
  const name = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
  if (!name || name.length > 80) {
    throw new CvError(400, 'invalid_name', 'CV name must contain 1 to 80 visible characters.');
  }
  return name;
}

function invalid(path, expected) {
  throw new CvError(400, 'invalid_resume', `${path} must be ${expected}.`);
}

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'an object');
  return value;
}

function requireArray(value, path) {
  if (!Array.isArray(value)) invalid(path, 'an array');
  return value;
}

function requireString(value, path, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    invalid(path, 'a string');
  }
}

function requireStringArray(value, path) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    invalid(path, 'an array of strings');
  }
}

function requireHttpsUrl(value, path) {
  requireString(value, path);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    invalid(path, 'a valid HTTPS URL');
  }
  if (
    parsed.protocol !== 'https:' ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    value !== value.trim()
  ) {
    invalid(path, 'a valid HTTPS URL');
  }
}

function requireIconClass(value, path) {
  requireString(value, path, true);
  if (value && !/^fa(?:s|r|b|l|d|t) fa-[a-z0-9-]+(?: fa-[a-z0-9-]+)*$/.test(value)) {
    invalid(path, 'a Font Awesome icon class');
  }
}

function validateLanguage(value, path) {
  const language = requireObject(value, path);
  const meta = requireObject(language.meta, `${path}.meta`);
  requireString(meta.title, `${path}.meta.title`);

  const sidebar = requireObject(language.sidebar, `${path}.sidebar`);
  requireString(sidebar.role, `${path}.sidebar.role`, true);
  requireString(sidebar.location, `${path}.sidebar.location`, true);

  for (const link of ['website', 'linkedin', 'github']) {
    const linkValue = requireObject(sidebar[link], `${path}.sidebar.${link}`);
    requireHttpsUrl(linkValue.url, `${path}.sidebar.${link}.url`);
  }

  const languages = requireObject(sidebar.languages, `${path}.sidebar.languages`);
  requireString(languages.title, `${path}.sidebar.languages.title`);
  requireStringArray(languages.items, `${path}.sidebar.languages.items`);

  requireArray(sidebar.sections, `${path}.sidebar.sections`).forEach((section, index) => {
    const sectionPath = `${path}.sidebar.sections[${index}]`;
    requireObject(section, sectionPath);
    requireString(section.title, `${sectionPath}.title`, true);
    requireString(section.content, `${sectionPath}.content`, true);
    requireIconClass(section.icon, `${sectionPath}.icon`);
  });

  const main = requireObject(language.main, `${path}.main`);
  const summary = requireObject(main.summary, `${path}.main.summary`);
  requireString(summary.title, `${path}.main.summary.title`);
  requireString(summary.content, `${path}.main.summary.content`, true);

  const experience = requireObject(main.experience, `${path}.main.experience`);
  requireString(experience.title, `${path}.main.experience.title`);
  requireArray(experience.items, `${path}.main.experience.items`).forEach((item, index) => {
    const itemPath = `${path}.main.experience.items[${index}]`;
    requireObject(item, itemPath);
    requireString(item.company, `${itemPath}.company`, true);
    requireString(item.role, `${itemPath}.role`, true);
    requireString(item.period, `${itemPath}.period`, true);
    requireStringArray(item.points, `${itemPath}.points`);
  });

  const projects = requireObject(main.projects, `${path}.main.projects`);
  requireString(projects.title, `${path}.main.projects.title`);
  requireArray(projects.items, `${path}.main.projects.items`).forEach((item, index) => {
    const itemPath = `${path}.main.projects.items[${index}]`;
    requireObject(item, itemPath);
    requireString(item.title, `${itemPath}.title`, true);
    requireString(item.description, `${itemPath}.description`, true);
  });

  const education = requireObject(main.education, `${path}.main.education`);
  requireString(education.title, `${path}.main.education.title`);
  requireArray(education.items, `${path}.main.education.items`).forEach((item, index) => {
    const itemPath = `${path}.main.education.items[${index}]`;
    requireObject(item, itemPath);
    requireString(item.school, `${itemPath}.school`, true);
    requireString(item.period, `${itemPath}.period`, true);
    requireString(item.description, `${itemPath}.description`, true);
  });
}

function assertResumeData(value) {
  const resume = requireObject(value, 'resume');
  validateLanguage(resume.en, 'resume.en');
  validateLanguage(resume.fr, 'resume.fr');
  return value;
}

function createBlankResume(template, displayName) {
  assertResumeData(template);
  const name = normalizeDisplayName(displayName);
  const blank = structuredClone(template);

  for (const language of ['en', 'fr']) {
    blank[language].meta.title = `Philippe Ho - ${name}`;
    blank[language].sidebar.role = '';
    blank[language].main.summary.content = '';
    blank[language].main.experience.items = [];
    blank[language].main.projects.items = [];
    blank[language].main.education.items = [];
  }

  return assertResumeData(blank);
}

module.exports = {
  CvError,
  assertResumeData,
  createBlankResume,
  normalizeDisplayName,
};
