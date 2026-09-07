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

function structButton(
    label: string,
    text: string,
    attributes: Record<string, string>,
): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'struct-btn';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    for (const [key, value] of Object.entries(attributes)) {
        button.dataset[key] = value;
    }
    return button;
}

function structControls(...buttons: HTMLButtonElement[]): HTMLElement {
    const controls = document.createElement('span');
    controls.className = 'struct-controls';
    controls.append(...buttons);
    return controls;
}

function addItemButton(collection: string, label: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'struct-controls struct-controls-add';
    wrapper.appendChild(
        structButton(label, '+ ' + label, {
            structAction: 'add-item',
            structCollection: collection,
        }),
    );
    return wrapper;
}

/**
 * Wraps an editable value so its controls sit beside it rather than inside it.
 * The editor reads innerText from the [data-path] element, so anything nested
 * within one ends up saved into the CV.
 */
function headingWithControls(
    path: string,
    text: string,
    controls: HTMLElement,
): HTMLHeadingElement {
    const heading = document.createElement('h3');
    heading.append(editableElement('span', path, text), controls);
    return heading;
}

function deleteButton(label: string, collection: string, index: number): HTMLElement {
    return structControls(
        structButton(label, '×', {
            structAction: 'remove-item',
            structCollection: collection,
            index: String(index),
        }),
    );
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
    // renderResume runs on every state change; drop the previous pass's add
    // buttons so they are not duplicated.
    document.querySelectorAll('.struct-controls-add').forEach((element) => element.remove());

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
            container.appendChild(deleteButton('Delete sidebar section', 'sidebarSections', index));
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
        sectionsContainer.appendChild(addItemButton('sidebarSections', 'Add section'));
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

    // Siblings of the lists, so they stay visible when a list is empty and a
    // blank CV can be populated at all.
    document.getElementById('experience-list')?.after(addItemButton('experience', 'Add job'));
    document.getElementById('projects-list')?.after(addItemButton('projects', 'Add project'));
    document.getElementById('education-list')?.after(addItemButton('education', 'Add school'));
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
    heading.appendChild(deleteButton('Delete job', 'experience', index));
    container.appendChild(heading);

    const period = editableElement('div', `${basePath}.period`, job.period);
    period.className = 'job-period';
    container.appendChild(period);

    const points = document.createElement('ul');
    job.points.forEach((point, pointIndex) => {
        const item = document.createElement('li');
        item.append(
            editableElement('span', `${basePath}.points.${pointIndex}`, point),
            structControls(
                structButton('Delete bullet point', '×', {
                    structAction: 'remove-point',
                    index: String(index),
                    pointIndex: String(pointIndex),
                }),
            ),
        );
        points.appendChild(item);
    });
    container.appendChild(points);

    const addPoint = document.createElement('div');
    addPoint.className = 'struct-controls struct-controls-add';
    addPoint.appendChild(
        structButton('Add bullet point', '+ bullet', {
            structAction: 'add-point',
            index: String(index),
        }),
    );
    container.appendChild(addPoint);
    return container;
}

function createProjectElement(project: ProjectItem, index: number): HTMLElement {
    const basePath = `main.projects.items.${index}`;
    const container = document.createElement('div');
    container.className = 'project';
    const heading = headingWithControls(
        `${basePath}.title`,
        project.title,
        deleteButton('Delete project', 'projects', index),
    );
    container.append(
        heading,
        editableElement('p', `${basePath}.description`, project.description),
    );
    return container;
}

function createEducationElement(education: EducationItem, index: number): HTMLElement {
    const basePath = `main.education.items.${index}`;
    const container = document.createElement('div');
    container.className = 'school';
    const schoolHeading = headingWithControls(
        `${basePath}.school`,
        education.school,
        deleteButton('Delete education entry', 'education', index),
    );
    container.appendChild(schoolHeading);
    const period = editableElement('div', `${basePath}.period`, education.period);
    period.className = 'edu-period';
    container.append(
        period,
        editableElement('p', `${basePath}.description`, education.description),
    );
    return container;
}
