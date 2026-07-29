import { setText, setList } from '../../components/resume/domUtils';
import type {
    EducationItem,
    JobItem,
    ProjectItem,
    ResumeLanguageData,
} from '../../types/resume';

type ResumeLanguage = 'en' | 'fr';

function editableElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    path: string,
    text: string,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    element.dataset.path = path;
    element.textContent = text;
    return element;
}

function appendTextWithLineBreaks(element: HTMLElement, value: string): void {
    const lines = value.split(/<br\s*\/?>|\r?\n/gi);
    lines.forEach((line, index) => {
        if (index > 0) element.appendChild(document.createElement('br'));
        element.appendChild(document.createTextNode(line));
    });
}

function createSidebarHeading(iconClass: string, path: string, title: string): HTMLHeadingElement {
    const heading = document.createElement('h2');
    const icon = document.createElement('i');
    icon.className = iconClass;
    icon.style.marginRight = '8px';
    heading.append(icon, ' ', editableElement('span', path, title));
    return heading;
}

export function renderResume(
    data: ResumeLanguageData,
    language: ResumeLanguage = 'en',
): void {
    document.title = data.meta.title;
    document.documentElement.lang = language;

    setText('name', 'Philippe Ho');
    setText('role', data.sidebar.role, 'sidebar.role');
    setText('location', data.sidebar.location, 'sidebar.location');

    const links = [
        ['link-website', data.sidebar.website],
        ['link-linkedin', data.sidebar.linkedin],
        ['link-github', data.sidebar.github],
    ] as const;
    for (const [id, link] of links) {
        const element = document.getElementById(id) as HTMLAnchorElement | null;
        if (!element) continue;
        element.href = link.url;
        element.style.display = 'inline-block';
    }

    const sectionsContainer = document.getElementById('sidebar-sections');
    if (sectionsContainer) {
        sectionsContainer.replaceChildren();

        data.sidebar.sections.forEach((section, index) => {
            const container = document.createElement('div');
            container.className = 'sidebar-section';
            container.appendChild(
                createSidebarHeading(
                    section.icon,
                    `sidebar.sections.${index}.title`,
                    section.title,
                ),
            );
            const content = editableElement(
                'p',
                `sidebar.sections.${index}.content`,
                '',
            );
            appendTextWithLineBreaks(content, section.content);
            container.appendChild(content);
            sectionsContainer.appendChild(container);
        });

        const languages = document.createElement('div');
        languages.className = 'sidebar-section';
        languages.appendChild(
            createSidebarHeading(
                'fas fa-earth-americas',
                'sidebar.languages.title',
                data.sidebar.languages.title,
            ),
        );
        const items = editableElement('div', 'sidebar.languages.items', '');
        items.dataset.arrayJoin = 'line-break';
        data.sidebar.languages.items.forEach((item, index) => {
            if (index > 0) items.appendChild(document.createElement('br'));
            items.appendChild(document.createTextNode(item));
        });
        languages.appendChild(items);
        sectionsContainer.appendChild(languages);
    }

    setText('summary-title', data.main.summary.title, 'main.summary.title');
    setText('summary-text', data.main.summary.content, 'main.summary.content');

    setText('experience-title', data.main.experience.title, 'main.experience.title');
    setList('experience-list', data.main.experience.items, createJobElement);
    setItemContainerVisibility('experience-list', data.main.experience.items.length > 0);

    setText('projects-title', data.main.projects.title, 'main.projects.title');
    setList('projects-list', data.main.projects.items, createProjectElement);
    setItemContainerVisibility('projects-list', data.main.projects.items.length > 0);

    setText('education-title', data.main.education.title, 'main.education.title');
    setList('education-list', data.main.education.items, createEducationElement);
    setItemContainerVisibility('education-list', data.main.education.items.length > 0);
}

function setItemContainerVisibility(id: string, hasItems: boolean): void {
    const container = document.getElementById(id);
    if (container) container.hidden = !hasItems;
}

function createJobElement(job: JobItem, index: number): HTMLElement {
    const basePath = `main.experience.items.${index}`;
    const container = document.createElement('div');
    container.className = 'job';

    const heading = document.createElement('h3');
    heading.append(
        editableElement('span', `${basePath}.company`, job.company),
        ', ',
        editableElement('span', `${basePath}.role`, job.role),
    );
    container.appendChild(heading);

    const period = editableElement('div', `${basePath}.period`, job.period);
    period.className = 'job-period';
    container.appendChild(period);

    const points = document.createElement('ul');
    job.points.forEach((point, pointIndex) => {
        points.appendChild(
            editableElement('li', `${basePath}.points.${pointIndex}`, point),
        );
    });
    container.appendChild(points);
    return container;
}

function createProjectElement(project: ProjectItem, index: number): HTMLElement {
    const basePath = `main.projects.items.${index}`;
    const container = document.createElement('div');
    container.className = 'project';
    container.append(
        editableElement('h3', `${basePath}.title`, project.title),
        editableElement('p', `${basePath}.description`, project.description),
    );
    return container;
}

function createEducationElement(education: EducationItem, index: number): HTMLElement {
    const basePath = `main.education.items.${index}`;
    const container = document.createElement('div');
    container.className = 'school';
    container.appendChild(
        editableElement('h3', `${basePath}.school`, education.school),
    );
    const period = editableElement('div', `${basePath}.period`, education.period);
    period.className = 'edu-period';
    container.append(
        period,
        editableElement('p', `${basePath}.description`, education.description),
    );
    return container;
}
