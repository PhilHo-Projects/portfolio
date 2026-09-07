import {
  readRequestedResumeId,
  resolveResumeId,
  resumeUrlForId,
} from './version-state.js';

/**
 * The CV is bilingual and the renderer addresses items by index, so every
 * structural change must apply to `en` and `fr` at the same position.
 * Diverging arrays still pass server validation, which checks each language
 * independently, and would surface later as a corrupted French CV.
 */
const BLANK_ITEMS = {
  experience: {
    en: { company: 'New company', role: 'New role', period: '', points: ['New achievement'] },
    fr: { company: 'Nouvelle entreprise', role: 'Nouveau poste', period: '', points: ['Nouvelle realisation'] },
  },
  projects: {
    en: { title: 'New project', description: 'Describe the project.' },
    fr: { title: 'Nouveau projet', description: 'Decrivez le projet.' },
  },
  education: {
    en: { school: 'New school', period: '', description: 'Describe the programme.' },
    fr: { school: 'Nouvelle ecole', period: '', description: 'Decrivez le programme.' },
  },
  sidebarSections: {
    en: { title: 'New section', content: 'Add details.', icon: 'fas fa-star' },
    fr: { title: 'Nouvelle section', content: 'Ajoutez des details.', icon: 'fas fa-star' },
  },
};

const BLANK_POINT = { en: 'New achievement', fr: 'Nouvelle realisation' };

const UNDO_LABELS = {
  experience: 'Job deleted.',
  projects: 'Project deleted.',
  education: 'Education entry deleted.',
  sidebarSections: 'Sidebar section deleted.',
  point: 'Bullet point deleted.',
};

function collectionOf(languageData, collection) {
  if (collection === 'sidebarSections') return languageData.sidebar.sections;
  return languageData.main[collection].items;
}

export function createResumeController({
  api,
  embeddedRegistry,
  embeddedData,
  initialHref,
  render,
  replaceUrl,
  onState,
}) {
  const state = {
    registry: null,
    activeId: null,
    data: null,
    language: 'en',
    editing: false,
    dirty: false,
    degraded: false,
    managementAvailable: false,
    undoLabel: null,
  };
  let currentHref = initialHref;
  let selectionSequence = 0;

  function snapshot() {
    return structuredClone(state);
  }

  function emit() {
    onState(snapshot());
  }

  function renderCurrent() {
    if (state.data) render(state.data[state.language], state.language);
  }

  function updateUrl() {
    if (!state.activeId) return;
    currentHref = resumeUrlForId(currentHref, state.activeId);
    const url = new URL(currentHref);
    replaceUrl(`${url.pathname}${url.search}${url.hash}`);
  }

  function requireActive() {
    if (!state.registry || !state.activeId || !state.data) {
      throw new Error('The CV controller has not finished initializing.');
    }
  }

  function requireCleanTransition(action) {
    if (state.dirty) {
      throw new Error(`Save or exit editing before ${action}.`);
    }
  }

  async function initialize() {
    try {
      const registry = await api.list();
      const activeId = resolveResumeId(readRequestedResumeId(currentHref), registry);
      const data = await api.read(activeId);
      state.registry = registry;
      state.activeId = activeId;
      state.data = data;
      state.degraded = false;
      renderCurrent();
      updateUrl();

      try {
        const session = await api.session();
        state.managementAvailable = session.available;
        state.editing = session.available && session.authenticated;
      } catch {
        state.managementAvailable = false;
        state.editing = false;
      }
      emit();
    } catch (error) {
      if (!embeddedRegistry || !embeddedData) throw error;
      state.registry = structuredClone(embeddedRegistry);
      state.activeId = embeddedRegistry.defaultResumeId;
      state.data = structuredClone(embeddedData);
      state.degraded = true;
      state.managementAvailable = false;
      state.editing = false;
      state.dirty = false;
      renderCurrent();
      updateUrl();
      emit();
    }
  }

  async function selectVersion(id, { discardDirty = false } = {}) {
    requireActive();
    clearUndo();
    if (state.degraded || (state.dirty && !discardDirty)) return false;
    const sequence = ++selectionSequence;
    const activeId = resolveResumeId(id, state.registry);
    const data = await api.read(activeId);
    if (sequence !== selectionSequence) return false;
    state.activeId = activeId;
    state.data = data;
    state.dirty = false;
    renderCurrent();
    updateUrl();
    emit();
    return true;
  }

  function toggleLanguage() {
    requireActive();
    state.language = state.language === 'en' ? 'fr' : 'en';
    renderCurrent();
    emit();
  }

  async function unlock(password) {
    if (!state.managementAvailable) {
      throw new Error('CV editing is temporarily unavailable.');
    }
    await api.login(password);
    state.editing = true;
    emit();
  }

  async function refreshRegistry() {
    state.registry = await api.list();
  }

  async function rename(name) {
    requireActive();
    await api.rename(state.activeId, name);
    await refreshRegistry();
    emit();
  }

  async function activateCreated(entry) {
    selectionSequence += 1;
    await refreshRegistry();
    state.activeId = entry.id;
    state.data = await api.read(entry.id);
    state.dirty = false;
    renderCurrent();
    updateUrl();
    emit();
  }

  async function duplicate(name) {
    requireActive();
    requireCleanTransition('duplicating this CV');
    const entry = await api.duplicate(state.activeId, name);
    await activateCreated(entry);
  }

  async function createBlank(name) {
    requireCleanTransition('creating a blank CV');
    const entry = await api.createBlank(name);
    await activateCreated(entry);
  }

  let undoSnapshot = null;

  function requireEditable() {
    requireActive();
    if (state.degraded) {
      throw new Error('CV editing is temporarily unavailable.');
    }
    if (!state.editing) {
      throw new Error('Unlock editing before changing the CV structure.');
    }
  }

  function pushUndo(label) {
    undoSnapshot = { label, data: structuredClone(state.data), dirty: state.dirty };
    state.undoLabel = label;
  }

  function clearUndo() {
    undoSnapshot = null;
    state.undoLabel = null;
  }

  function commitStructural() {
    state.dirty = true;
    renderCurrent();
    emit();
  }

  function addItem(collection) {
    requireEditable();
    const template = BLANK_ITEMS[collection];
    if (!template) throw new Error(`Unknown CV collection: ${collection}.`);
    clearUndo();
    for (const language of ['en', 'fr']) {
      collectionOf(state.data[language], collection).push(structuredClone(template[language]));
    }
    commitStructural();
  }

  function removeItem(collection, index) {
    requireEditable();
    if (!BLANK_ITEMS[collection]) throw new Error(`Unknown CV collection: ${collection}.`);
    if (!Number.isInteger(index) || index < 0) return;
    pushUndo(UNDO_LABELS[collection]);
    for (const language of ['en', 'fr']) {
      collectionOf(state.data[language], collection).splice(index, 1);
    }
    commitStructural();
  }

  function addPoint(jobIndex) {
    requireEditable();
    clearUndo();
    for (const language of ['en', 'fr']) {
      const job = state.data[language].main.experience.items[jobIndex];
      if (job) job.points.push(BLANK_POINT[language]);
    }
    commitStructural();
  }

  function removePoint(jobIndex, pointIndex) {
    requireEditable();
    pushUndo(UNDO_LABELS.point);
    for (const language of ['en', 'fr']) {
      const job = state.data[language].main.experience.items[jobIndex];
      if (job) job.points.splice(pointIndex, 1);
    }
    commitStructural();
  }

  function undoStructural() {
    if (!undoSnapshot) return false;
    state.data = undoSnapshot.data;
    state.dirty = undoSnapshot.dirty;
    clearUndo();
    renderCurrent();
    emit();
    return true;
  }

  function markDirty() {
    if (!state.editing) return;
    state.dirty = true;
    emit();
  }

  async function save() {
    requireActive();
    try {
      await api.save(state.activeId, state.data);
      state.dirty = false;
      clearUndo();
      await refreshRegistry();
      emit();
    } catch (error) {
      if (error?.status === 401) state.editing = false;
      emit();
      throw error;
    }
  }

  async function listBackups() {
    requireActive();
    return api.backups(state.activeId);
  }

  async function restore(backupId) {
    requireActive();
    clearUndo();
    requireCleanTransition('restoring a backup');
    state.data = await api.restore(state.activeId, backupId);
    state.dirty = false;
    renderCurrent();
    emit();
  }

  async function exitEditing() {
    requireActive();
    clearUndo();
    let freshData = null;
    try {
      freshData = await api.read(state.activeId);
    } catch {
      // Preserve the current in-memory data if the public read is temporarily unavailable.
    }
    await api.logout();
    state.editing = false;
    if (freshData) {
      state.data = freshData;
      state.dirty = false;
      renderCurrent();
    }
    emit();
  }

  return {
    get state() {
      return snapshot();
    },
    initialize,
    selectVersion,
    toggleLanguage,
    unlock,
    rename,
    duplicate,
    createBlank,
    markDirty,
    addItem,
    removeItem,
    addPoint,
    removePoint,
    undoStructural,
    save,
    listBackups,
    restore,
    exitEditing,
  };
}
