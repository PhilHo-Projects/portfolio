export interface ResumeData {
    en: ResumeLanguageData;
    fr: ResumeLanguageData;
}

export interface ResumeRegistryEntry {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface ResumeRegistry {
    schemaVersion: 1;
    defaultResumeId: string;
    resumes: ResumeRegistryEntry[];
}

export interface ApiErrorPayload {
    error: {
        code: string;
        message: string;
    };
}

export interface ResumeBackup {
    id: string;
    createdAt: string;
}

export interface EditorSession {
    authenticated: boolean;
    available: boolean;
}

export interface ResumeLanguageData {
    meta: {
        title: string;
    };
    sidebar: {
        role: string;
        location: string;
        website: { url: string };
        linkedin: { url: string };
        github: { url: string };
        languages: {
            title: string;
            items: string[];
        };
        sections: SidebarSection[];
    };
    main: {
        summary: {
            title: string;
            content: string;
        };
        experience: {
            title: string;
            items: JobItem[];
        };
        projects: {
            title: string;
            items: ProjectItem[];
        };
        education: {
            title: string;
            items: EducationItem[];
        };
    };
}

export interface SidebarSection {
    title: string;
    content: string;
    icon: string;
}

export interface JobItem {
    company: string;
    role: string;
    period: string;
    points: string[];
}

export interface ProjectItem {
    title: string;
    description: string;
}

export interface EducationItem {
    school: string;
    period: string;
    description: string;
}
