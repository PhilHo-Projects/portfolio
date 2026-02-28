import { fetchResumeData } from '../../components/resume/ResumeLoader';
import { renderResume } from './renderer';
import { Editor } from '../../components/resume/Editor';
import { ResumeData } from '../../types/resume';
let resumeData: ResumeData | null = null;
let currentLang: 'en' | 'fr' = 'en';
let editor: Editor | null = null;

async function init(): Promise<void> {
    // Setup Toggles First (Safe UI logic)
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'fr' : 'en';
            toggleBtn.textContent = currentLang === 'en' ? 'FR' : 'EN';
            if (resumeData && editor) {
                try {
                    renderResume(resumeData[currentLang]);
                    editor.bind(resumeData[currentLang]);
                } catch (e) { console.error("Render Error: ", e); }
            }
        });
    }

    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => { window.print(); });
    }

    const editToggle = document.getElementById('edit-toggle');
    if (editToggle) {
        editToggle.addEventListener('click', () => {
            if (editor) editor.toggleEditMode(!editor.isEditing);
        });
    }

    try {
        resumeData = await fetchResumeData();
        editor = new Editor();
        editor.onSave = async () => {
            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resumeData)
                });
                if (!response.ok) throw new Error('Network response was not ok');
            } catch (e) { throw e; }
        };

        if (resumeData) {
            renderResume(resumeData[currentLang]);
            editor.bind(resumeData[currentLang]);
        } else {
            console.error("Failed to load resume data JSON was null.");
        }
    } catch (error) {
        console.error("Initialization error main.ts:", error);
    }
}

init();
