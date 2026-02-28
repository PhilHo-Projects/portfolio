import '../styles/input.css';
import { fetchResumeData } from '../components/ResumeLoader';
import { renderResume } from './renderer';
import { Editor } from '../components/Editor';
import { ResumeData } from '../types/resume';

let resumeData: ResumeData | null = null;
let currentLang: 'en' | 'fr' = 'en';
let editor: Editor | null = null;

async function init(): Promise<void> {
    resumeData = await fetchResumeData();

    // Initialize Editor
    editor = new Editor();
    editor.onSave = async () => {
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resumeData)
            });
            if (!response.ok) throw new Error('Network response was not ok');
        } catch (e) {
            throw e; // Editor will catch and show error
        }
    };

    if (resumeData) {
        // Initial Render
        renderResume(resumeData[currentLang]);
        editor.bind(resumeData[currentLang]);
    } else {
        console.error("Failed to load resume data");
    }

    // Setup Toggle
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Toggle State
            currentLang = currentLang === 'en' ? 'fr' : 'en';

            // Update Button Text
            toggleBtn.textContent = currentLang === 'en' ? 'FR' : 'EN';

            // Re-render
            if (resumeData && editor) {
                renderResume(resumeData[currentLang]);
                editor.bind(resumeData[currentLang]);
            }
        });
    }

    // PDF Download Logic
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Edit Toggle Logic
    const editToggle = document.getElementById('edit-toggle');
    if (editToggle) {
        editToggle.addEventListener('click', () => {
            if (editor) {
                editor.toggleEditMode(!editor.isEditing);
            }
        });
    }
}

init();
