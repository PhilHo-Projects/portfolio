import {
    getEmbeddedResumeData,
    getEmbeddedResumeRegistry,
} from '../../components/resume/ResumeLoader';
import { Editor } from '../../components/resume/Editor';
import type {
    ResumeBackup,
    ResumeData,
    ResumeLanguageData,
    ResumeRegistry,
} from '../../types/resume';
import { createResumeApi } from './api';
import { createResumeController } from './resume-controller';
import { renderResume } from './renderer';

type ApplicationState = {
    registry: ResumeRegistry | null;
    activeId: string | null;
    data: ResumeData | null;
    language: 'en' | 'fr';
    editing: boolean;
    dirty: boolean;
    degraded: boolean;
    managementAvailable: boolean;
};

type NameMode = 'rename' | 'duplicate' | 'blank';

function requiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`CV interface is missing #${id}.`);
    return element as T;
}

const cvSelect = requiredElement<HTMLSelectElement>('cv-select');
const languageButton = requiredElement<HTMLButtonElement>('lang-toggle');
const printButton = requiredElement<HTMLButtonElement>('print-resume');
const editButton = requiredElement<HTMLButtonElement>('edit-toggle');
const editorActions = requiredElement<HTMLElement>('editor-actions');
const renameButton = requiredElement<HTMLButtonElement>('rename-cv');
const duplicateButton = requiredElement<HTMLButtonElement>('duplicate-cv');
const blankButton = requiredElement<HTMLButtonElement>('new-blank-cv');
const saveButton = requiredElement<HTMLButtonElement>('save-cv');
const historyButton = requiredElement<HTMLButtonElement>('history-cv');
const exitButton = requiredElement<HTMLButtonElement>('exit-edit');
const status = requiredElement<HTMLElement>('resume-status');

const loginDialog = requiredElement<HTMLDialogElement>('editor-login-dialog');
const loginForm = requiredElement<HTMLFormElement>('editor-login-form');
const passwordInput = requiredElement<HTMLInputElement>('editor-password');
const loginError = requiredElement<HTMLElement>('editor-login-error');

const nameDialog = requiredElement<HTMLDialogElement>('cv-name-dialog');
const nameForm = requiredElement<HTMLFormElement>('cv-name-form');
const nameTitle = requiredElement<HTMLElement>('cv-name-title');
const nameInput = requiredElement<HTMLInputElement>('cv-name-input');
const nameError = requiredElement<HTMLElement>('cv-name-error');

const historyDialog = requiredElement<HTMLDialogElement>('cv-history-dialog');
const historyList = requiredElement<HTMLElement>('cv-history-list');
const historyError = requiredElement<HTMLElement>('cv-history-error');
const restoreConfirmation = requiredElement<HTMLElement>('restore-confirmation');
const restoreBackupName = requiredElement<HTMLElement>('restore-backup-name');
const confirmRestoreButton = requiredElement<HTMLButtonElement>('confirm-restore');
const cancelRestoreButton = requiredElement<HTMLButtonElement>('cancel-restore');

const discardDialog = requiredElement<HTMLDialogElement>('discard-edit-dialog');
const confirmExitButton = requiredElement<HTMLButtonElement>('confirm-exit-edit');

const api = createResumeApi();
const editor = new Editor();
let nameMode: NameMode = 'rename';
let selectedBackup: ResumeBackup | null = null;
let transientStatus = 'Loading CV…';

function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : 'The CV action failed.';
}

function showModal(dialog: HTMLDialogElement): void {
    if (!dialog.open) dialog.showModal();
}

function currentName(): string {
    const state = controller.state as ApplicationState;
    return state.registry?.resumes.find(({ id }) => id === state.activeId)?.name ?? '';
}

function renderApplicationState(state: ApplicationState): void {
    const previousValue = cvSelect.value;
    cvSelect.replaceChildren(
        ...(state.registry?.resumes ?? []).map((entry) => {
            const option = document.createElement('option');
            option.value = entry.id;
            option.textContent = entry.name;
            return option;
        }),
    );
    cvSelect.value = state.activeId ?? previousValue;
    languageButton.textContent = state.language === 'en' ? 'FR' : 'EN';

    editorActions.hidden = !state.editing;
    editButton.hidden = state.editing;
    editor.setEditing(state.editing);

    cvSelect.disabled = state.dirty || state.degraded;
    editButton.disabled = state.degraded || !state.managementAvailable;

    if (state.dirty) {
        status.textContent = 'Unsaved changes — save or exit editing first.';
    } else if (state.degraded) {
        status.textContent = 'Showing the built-in gaming CV — the live CV service is temporarily unavailable.';
    } else if (!state.managementAvailable) {
        status.textContent = 'CV editing is temporarily unavailable.';
    } else {
        status.textContent = transientStatus;
    }
}

const controller = createResumeController({
    api,
    embeddedRegistry: getEmbeddedResumeRegistry(),
    embeddedData: getEmbeddedResumeData(),
    initialHref: window.location.href,
    render: (languageData: ResumeLanguageData) => {
        renderResume(languageData);
        editor.bind(languageData);
    },
    replaceUrl: (relativeUrl: string) => history.replaceState(null, '', relativeUrl),
    onState: (state: ApplicationState) => renderApplicationState(state),
});

editor.onDirty = () => controller.markDirty();

printButton.addEventListener('click', () => window.print());
languageButton.addEventListener('click', () => controller.toggleLanguage());

cvSelect.addEventListener('change', async () => {
    if (controller.state.dirty) return;
    transientStatus = 'Loading CV…';
    try {
        await controller.selectVersion(cvSelect.value);
        transientStatus = '';
        status.textContent = '';
    } catch (error) {
        status.textContent = messageFrom(error);
    }
});

editButton.addEventListener('click', () => {
    loginError.textContent = '';
    passwordInput.value = '';
    showModal(loginDialog);
    passwordInput.focus();
});

loginForm.addEventListener('submit', async (event) => {
    const submitter = event.submitter as HTMLButtonElement | null;
    if (submitter?.formMethod === 'dialog') return;
    event.preventDefault();
    loginError.textContent = '';
    try {
        await controller.unlock(passwordInput.value);
        passwordInput.value = '';
        loginDialog.close();
        transientStatus = 'Editing unlocked.';
        status.textContent = transientStatus;
    } catch (error) {
        loginError.textContent = messageFrom(error);
    }
});

function openNameDialog(mode: NameMode, title: string, value: string): void {
    nameMode = mode;
    nameTitle.textContent = title;
    nameInput.value = value;
    nameError.textContent = '';
    showModal(nameDialog);
    nameInput.focus();
    nameInput.select();
}

renameButton.addEventListener('click', () => {
    openNameDialog('rename', 'Rename CV', currentName());
});

duplicateButton.addEventListener('click', () => {
    openNameDialog('duplicate', 'Duplicate CV', `${currentName()} Copy`);
});

blankButton.addEventListener('click', () => {
    openNameDialog('blank', 'Create blank CV', '');
});

nameForm.addEventListener('submit', async (event) => {
    const submitter = event.submitter as HTMLButtonElement | null;
    if (submitter?.formMethod === 'dialog') return;
    event.preventDefault();
    nameError.textContent = '';
    try {
        if (nameMode === 'rename') await controller.rename(nameInput.value);
        if (nameMode === 'duplicate') await controller.duplicate(nameInput.value);
        if (nameMode === 'blank') await controller.createBlank(nameInput.value);
        nameDialog.close();
        transientStatus = nameMode === 'rename' ? 'CV renamed.' : 'CV created.';
        status.textContent = transientStatus;
    } catch (error) {
        nameError.textContent = messageFrom(error);
    }
});

saveButton.addEventListener('click', async () => {
    transientStatus = 'Saving…';
    status.textContent = transientStatus;
    saveButton.disabled = true;
    try {
        await controller.save();
        transientStatus = 'Saved.';
        status.textContent = transientStatus;
    } catch (error) {
        transientStatus = `Save failed: ${messageFrom(error)}`;
        status.textContent = transientStatus;
    } finally {
        saveButton.disabled = false;
    }
});

function backupLabel(backup: ResumeBackup): string {
    const timestamp = new Date(backup.createdAt);
    return Number.isNaN(timestamp.getTime())
        ? backup.id
        : timestamp.toLocaleString();
}

historyButton.addEventListener('click', async () => {
    historyList.replaceChildren();
    historyError.textContent = '';
    restoreConfirmation.hidden = true;
    selectedBackup = null;
    showModal(historyDialog);
    try {
        const backups = await controller.listBackups();
        if (backups.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No backups yet. A backup is created before each save.';
            historyList.appendChild(empty);
            return;
        }
        for (const backup of backups) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `Restore ${backupLabel(backup)}`;
            button.addEventListener('click', () => {
                selectedBackup = backup;
                restoreBackupName.textContent = backupLabel(backup);
                restoreConfirmation.hidden = false;
                confirmRestoreButton.focus();
            });
            historyList.appendChild(button);
        }
    } catch (error) {
        historyError.textContent = messageFrom(error);
    }
});

cancelRestoreButton.addEventListener('click', () => {
    selectedBackup = null;
    restoreConfirmation.hidden = true;
});

confirmRestoreButton.addEventListener('click', async () => {
    if (!selectedBackup) return;
    confirmRestoreButton.disabled = true;
    historyError.textContent = '';
    try {
        await controller.restore(selectedBackup.id);
        historyDialog.close();
        transientStatus = 'Backup restored.';
        status.textContent = transientStatus;
    } catch (error) {
        historyError.textContent = messageFrom(error);
    } finally {
        confirmRestoreButton.disabled = false;
    }
});

async function exitEditing(): Promise<void> {
    try {
        await controller.exitEditing();
        transientStatus = '';
        status.textContent = '';
    } catch (error) {
        status.textContent = messageFrom(error);
    }
}

exitButton.addEventListener('click', () => {
    if (controller.state.dirty) showModal(discardDialog);
    else void exitEditing();
});

confirmExitButton.addEventListener('click', async () => {
    discardDialog.close();
    await exitEditing();
});

async function init(): Promise<void> {
    try {
        await controller.initialize();
        if (!controller.state.dirty && controller.state.managementAvailable) {
            transientStatus = '';
            status.textContent = '';
        }
    } catch (error) {
        console.error('CV interface initialization failed.');
        status.textContent = messageFrom(error);
    }
}

void init();
