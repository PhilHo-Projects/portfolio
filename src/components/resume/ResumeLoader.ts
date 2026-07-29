import type { ResumeData, ResumeRegistry } from '../../types/resume';

function parseEmbedded<T>(id: string, label: string): T | null {
    const embeddedData = document.getElementById(id);

    if (!embeddedData?.textContent) {
        return null;
    }

    try {
        return JSON.parse(embeddedData.textContent) as T;
    } catch {
        console.error(`Unable to parse embedded ${label}.`);
        return null;
    }
}

export function getEmbeddedResumeData(): ResumeData | null {
    return parseEmbedded<ResumeData>('initial-resume-data', 'CV data');
}

export function getEmbeddedResumeRegistry(): ResumeRegistry | null {
    return parseEmbedded<ResumeRegistry>('initial-resume-registry', 'CV registry');
}

// Kept until the page controller migration is wired in the next implementation step.
export async function fetchResumeData(): Promise<ResumeData | null> {
    return getEmbeddedResumeData();
}
