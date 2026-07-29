import {
  readRequestedResumeId,
  resolveResumeId,
  resumeUrlForId,
} from './version-state.js';

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
  };
  let currentHref = initialHref;

  function snapshot() {
    return structuredClone(state);
  }

  function emit() {
    onState(snapshot());
  }

  function renderCurrent() {
    if (state.data) render(state.data[state.language]);
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
    if (state.degraded || (state.dirty && !discardDirty)) return false;
    const activeId = resolveResumeId(id, state.registry);
    const data = await api.read(activeId);
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
    const entry = await api.duplicate(state.activeId, name);
    await activateCreated(entry);
  }

  async function createBlank(name) {
    const entry = await api.createBlank(name);
    await activateCreated(entry);
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
    state.data = await api.restore(state.activeId, backupId);
    state.dirty = false;
    renderCurrent();
    emit();
  }

  async function exitEditing() {
    requireActive();
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
    save,
    listBackups,
    restore,
    exitEditing,
  };
}
