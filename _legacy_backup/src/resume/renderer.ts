import { setText, setHTML, setList } from '../components/domUtils';
import { ResumeLanguageData, JobItem, ProjectItem, EducationItem } from '../types/resume';

export function renderResume(data: ResumeLanguageData): void {
    // Meta
    document.title = data.meta.title;

    // Header
    setText('name', "Philippe Ho"); // Static
    setText('role', data.sidebar.role, 'sidebar.role');

    // Contact Info
    setText('location', data.sidebar.location, 'sidebar.location');

    // Social Links (Website, LinkedIn, GitHub)
    const websiteLink = document.getElementById('link-website') as HTMLAnchorElement | null;
    const linkedinLink = document.getElementById('link-linkedin') as HTMLAnchorElement | null;
    const githubLink = document.getElementById('link-github') as HTMLAnchorElement | null;

    if (data.sidebar.website && websiteLink) websiteLink.href = data.sidebar.website.url;
    if (data.sidebar.linkedin && linkedinLink) linkedinLink.href = data.sidebar.linkedin.url;
    if (data.sidebar.github && githubLink) githubLink.href = data.sidebar.github.url;

    // Hide if not available
    if (websiteLink) websiteLink.style.display = data.sidebar.website ? 'inline-block' : 'none';
    if (linkedinLink) linkedinLink.style.display = data.sidebar.linkedin ? 'inline-block' : 'none';
    if (githubLink) githubLink.style.display = data.sidebar.github ? 'inline-block' : 'none';

    // Sidebar Sections
    const sectionsContainer = document.getElementById('sidebar-sections');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = '';

        data.sidebar.sections.forEach((section, index) => {
            const div = document.createElement('div');
            div.className = 'sidebar-section';
            div.innerHTML = `
            <h2><i class="${section.icon}" style="margin-right: 8px;"></i> <span data-path="sidebar.sections.${index}.title">${section.title}</span></h2>
            <p data-path="sidebar.sections.${index}.content">${section.content}</p>
          `;
            sectionsContainer.appendChild(div);
        });

        // Languages
        const langDiv = document.createElement('div');
        langDiv.className = 'sidebar-section';
        langDiv.innerHTML = `
        <h2><i class="fas fa-earth-americas" style="margin-right: 8px;"></i> <span data-path="sidebar.languages.title">${data.sidebar.languages.title}</span></h2>
        <div data-path="sidebar.languages.items" data-array-join="<br>">${data.sidebar.languages.items.join('<br>')}</div>
      `;
        sectionsContainer.appendChild(langDiv);
    }

    // Main Content
    setText('summary-title', data.main.summary.title, 'main.summary.title');
    setText('summary-text', data.main.summary.content, 'main.summary.content');

    // Experience
    setText('experience-title', data.main.experience.title, 'main.experience.title');
    setList('experience-list', data.main.experience.items, createJobElement);

    // Projects
    setText('projects-title', data.main.projects.title, 'main.projects.title');
    setList('projects-list', data.main.projects.items, createProjectElement);

    // Education
    setText('education-title', data.main.education.title, 'main.education.title');
    setList('education-list', data.main.education.items, createEducationElement);
}

function createJobElement(job: JobItem, index: number): HTMLElement {
    const basePath = `main.experience.items.${index}`;
    const div = document.createElement('div');
    div.className = 'job';
    div.innerHTML = `
        <h3><span data-path="${basePath}.company">${job.company}</span>, <span data-path="${basePath}.role">${job.role}</span></h3>
        <div class="job-period" data-path="${basePath}.period">${job.period}</div>
        <ul>
            ${job.points.map((p, pIndex) => `<li data-path="${basePath}.points.${pIndex}">${p}</li>`).join('')}
        </ul>
    `;
    return div;
}

function createProjectElement(project: ProjectItem, index: number): HTMLElement {
    const basePath = `main.projects.items.${index}`;
    const div = document.createElement('div');
    div.className = 'project';
    div.innerHTML = `
        <h3 data-path="${basePath}.title">${project.title}</h3>
        <p data-path="${basePath}.description">${project.description}</p>
    `;
    return div;
}

function createEducationElement(edu: EducationItem, index: number): HTMLElement {
    const basePath = `main.education.items.${index}`;
    const div = document.createElement('div');
    div.className = 'school';
    div.innerHTML = `
        <h3 data-path="${basePath}.school">${edu.school}</h3>
        <div class="edu-period" data-path="${basePath}.period">${edu.period}</div>
        <p data-path="${basePath}.description">${edu.description}</p>
    `;
    return div;
}
