import {
    getEmbeddedResumeData,
    getEmbeddedResumeRegistry,
} from '../../components/resume/ResumeLoader';
import { Editor } from '../../components/resume/Editor';
import type {
    ResumeBackup,
    ResumeLanguageData,
} from '../../types/resume';
import { createResumeApi } from './api';
import { createPageFitter } from './page-fit';
import type { PageFitResult } from './page-fit';
import { createResumeController } from './resume-controller';
import type { ResumeControllerState, StructuralCollection } from './resume-controller';
import { renderResume } from './renderer';

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
const pageFitGauge = requiredElement<HTMLElement>('page-fit-gauge');
const pageFitFill = requiredElement<HTMLElement>('page-fit-fill');
const pageFitLabel = requiredElement<HTMLElement>('page-fit-label');

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
const resumeContent = requiredElement<HTMLElement>('resume-content');

/**
 * The grid stretches both columns to the taller row, so scrollHeight reports
 * the stretched height for both and cannot be used. Measure the union of each
 * column's children instead.
 */
function columnHeight(column: Element | null): number {
    if (!column) return 0;
    const children = [...column.children].filter((child) => child.getClientRects().length > 0);
    if (children.length === 0) return 0;
    const top = Math.min(...children.map((child) => child.getBoundingClientRect().top));
    const bottom = Math.max(...children.map((child) => child.getBoundingClientRect().bottom));
    const styles = getComputedStyle(column);
    return (bottom - top) + parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
}

const pageFitter = createPageFitter({
    measure: () => Math.max(
        columnHeight(resumeContent.querySelector('.content')),
        columnHeight(resumeContent.querySelector('.sidebar')),
    ),
    applyStep: (step: number) => {
        resumeContent.dataset.density = String(step);
    },
    getLineHeight: () => {
        const sample = resumeContent.querySelector('.content p');
        if (!sample) return 21;
        const lineHeight = parseFloat(getComputedStyle(sample).lineHeight);
        return Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 21;
    },
});

let lastFitResult: PageFitResult | null = null;
let fitTimer = 0;

function renderGauge(result: PageFitResult): void {
    const state = !result.fits ? 'over' : result.step === 0 ? 'fits' : 'tightened';
    pageFitGauge.dataset.fitState = state;
    pageFitGauge.setAttribute('aria-valuenow', String(Math.min(100, result.fillPercent)));
    pageFitFill.style.width = `${Math.min(100, result.fillPercent)}%`;

    if (state === 'fits') {
        pageFitLabel.textContent = `${result.fillPercent}% — fits one page`;
    } else if (state === 'tightened') {
        pageFitLabel.textContent = `${result.fillPercent}% — fits, auto-tightened`;
    } else {
        const lines = result.linesToCut === 1 ? 'line' : 'lines';
        pageFitLabel.textContent =
            `${result.fillPercent}% — over by ${result.overflowPx}px, cut ~${result.linesToCut} ${lines}`;
    }
}

function runPageFit(): void {
    lastFitResult = pageFitter.fit();
    if (!lastFitResult.stale) renderGauge(lastFitResult);
}

function schedulePageFit(): void {
    window.clearTimeout(fitTimer);
    fitTimer = window.setTimeout(runPageFit, 150);
}
let nameMode: NameMode = 'rename';
let selectedBackup: ResumeBackup | null = null;
let transientStatus = 'Loading CV…';

function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : 'The CV action failed.';
}

function showModal(dialog: HTMLDialogElement): void {
    if (!dialog.open) dialog.showModal();
}

function resetDialog(dialog: HTMLDialogElement): void {
    dialog.querySelectorAll<HTMLElement>('.dialog-error').forEach((element) => {
        element.textContent = '';
    });
    dialog.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
        input.value = '';
    });
}

// Cancel cannot be a dialog-method submit: these forms have required inputs and
// formmethod="dialog" does not bypass constraint validation, so an empty field
// would block the close.
for (const dialog of [loginDialog, nameDialog, historyDialog, discardDialog]) {
    dialog.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('[data-dialog-close]')) {
            dialog.close('cancel');
        }
    });
    dialog.addEventListener('close', () => resetDialog(dialog));
}

function currentName(): string {
    const state = controller.state;
    return state.registry?.resumes.find(({ id }) => id === state.activeId)?.name ?? '';
}

function renderApplicationState(state: ResumeControllerState): void {
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
    document.body.classList.toggle('is-editing', state.editing);

    cvSelect.disabled = state.dirty || state.degraded;
    editButton.disabled = state.degraded || !state.managementAvailable;
    duplicateButton.disabled = state.dirty;
    blankButton.disabled = state.dirty;
    historyButton.disabled = state.dirty;

    if (state.undoLabel) {
        status.replaceChildren(document.createTextNode(`${state.undoLabel} `));
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.id = 'undo-structural';
        undo.className = 'status-undo';
        undo.textContent = 'Undo';
        undo.addEventListener('click', () => controller.undoStructural());
        status.appendChild(undo);
    } else if (state.dirty) {
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
    render: (languageData: ResumeLanguageData, language: 'en' | 'fr') => {
        renderResume(languageData, language);
        editor.bind(languageData);
        runPageFit();
    },
    replaceUrl: (relativeUrl: string) => history.replaceState(null, '', relativeUrl),
    onState: (state: ResumeControllerState) => renderApplicationState(state),
});

editor.onDirty = () => {
    controller.markDirty();
    schedulePageFit();
};

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
        cvSelect.value = controller.state.activeId ?? '';
        status.textContent = messageFrom(error);
    }
});

resumeContent.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLElement>('[data-struct-action]');
    if (!button) return;

    const { structAction, structCollection, index, pointIndex } = button.dataset;
    try {
        if (structAction === 'add-item' && structCollection) {
            controller.addItem(structCollection as StructuralCollection);
        } else if (structAction === 'remove-item' && structCollection) {
            controller.removeItem(structCollection as StructuralCollection, Number(index));
        } else if (structAction === 'add-point') {
            controller.addPoint(Number(index));
        } else if (structAction === 'remove-point') {
            controller.removePoint(Number(index), Number(pointIndex));
        }
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
        // Web font metrics change measured height materially, so refit once
        // the real faces have loaded.
        void document.fonts.ready.then(runPageFit);
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
