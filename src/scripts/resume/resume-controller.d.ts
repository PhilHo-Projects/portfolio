import type {
    EditorSession,
    ResumeBackup,
    ResumeData,
    ResumeLanguageData,
    ResumeRegistry,
    ResumeRegistryEntry,
} from '../../types/resume';

export type StructuralCollection =
    | 'experience'
    | 'projects'
    | 'education'
    | 'sidebarSections';

export type ResumeControllerState = {
    registry: ResumeRegistry | null;
    activeId: string | null;
    data: ResumeData | null;
    language: 'en' | 'fr';
    editing: boolean;
    dirty: boolean;
    degraded: boolean;
    managementAvailable: boolean;
    undoLabel: string | null;
};

type ResumeApi = {
    list(): Promise<ResumeRegistry>;
    read(id: string): Promise<ResumeData>;
    session(): Promise<EditorSession>;
    login(password: string): Promise<void>;
    logout(): Promise<void>;
    save(id: string, data: ResumeData): Promise<void>;
    rename(id: string, name: string): Promise<ResumeRegistryEntry>;
    duplicate(id: string, name: string): Promise<ResumeRegistryEntry>;
    createBlank(name: string): Promise<ResumeRegistryEntry>;
    backups(id: string): Promise<ResumeBackup[]>;
    restore(id: string, backupId: string): Promise<ResumeData>;
};

type ResumeControllerOptions = {
    api: ResumeApi;
    embeddedRegistry: ResumeRegistry | null;
    embeddedData: ResumeData | null;
    initialHref: string;
    render(data: ResumeLanguageData, language: 'en' | 'fr'): void;
    replaceUrl(url: string): void;
    onState(state: ResumeControllerState): void;
};

export type ResumeController = {
    readonly state: ResumeControllerState;
    initialize(): Promise<void>;
    selectVersion(id: string, options?: { discardDirty?: boolean }): Promise<boolean>;
    toggleLanguage(): void;
    unlock(password: string): Promise<void>;
    rename(name: string): Promise<void>;
    duplicate(name: string): Promise<void>;
    createBlank(name: string): Promise<void>;
    markDirty(): void;
    addItem(collection: StructuralCollection): void;
    removeItem(collection: StructuralCollection, index: number): void;
    addPoint(jobIndex: number): void;
    removePoint(jobIndex: number, pointIndex: number): void;
    undoStructural(): boolean;
    save(): Promise<void>;
    listBackups(): Promise<ResumeBackup[]>;
    restore(backupId: string): Promise<void>;
    exitEditing(): Promise<void>;
};

export function createResumeController(options: ResumeControllerOptions): ResumeController;
