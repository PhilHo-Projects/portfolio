import { ResumeData } from '../../types/resume';

function getEmbeddedResumeData(): ResumeData | null {
    const embeddedData = document.getElementById('initial-resume-data');

    if (!embeddedData?.textContent) {
        return null;
    }

    try {
        return JSON.parse(embeddedData.textContent) as ResumeData;
    } catch (error) {
        console.error('Error parsing embedded resume data:', error);
        return null;
    }
}

export async function fetchResumeData(): Promise<ResumeData | null> {
    const embeddedResumeData = getEmbeddedResumeData();

    try {
        const response = await fetch(import.meta.env.BASE_URL + 'data/resume.json');
        if (!response.ok) throw new Error('Failed to load resume data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching resume data, falling back to embedded data:', error);
        return embeddedResumeData;
    }
}
