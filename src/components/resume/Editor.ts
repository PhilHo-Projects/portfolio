import type { ResumeLanguageData } from '../../types/resume';

export class Editor {
    private currentData: ResumeLanguageData | null = null;
    public isEditing = false;
    public onDirty: (() => void) | null = null;

    public bind(data: ResumeLanguageData): void {
        this.currentData = data;
        this.applyEditable(this.isEditing);
    }

    public setEditing(active: boolean): void {
        this.isEditing = active;
        this.applyEditable(active);
    }

    private applyEditable(active: boolean): void {
        document.querySelectorAll<HTMLElement>('[data-path]').forEach((element) => {
            element.contentEditable = active ? 'true' : 'false';
            element.classList.toggle('editable-highlight', active);
            element.oninput = active
                ? (event) => {
                    const path = element.dataset.path;
                    if (path) this.handleInput(event, path);
                }
                : null;
        });
    }

    /**
     * Structural controls must never be nested inside a [data-path] element,
     * but read defensively anyway: a stray control would otherwise be saved
     * into the CV as text the moment the field is edited.
     */
    private static readValue(target: HTMLElement): string {
        if (!target.querySelector('.struct-controls')) return target.innerText;
        const clone = target.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.struct-controls').forEach((element) => element.remove());
        return clone.textContent ?? '';
    }

    private handleInput(event: Event, path: string): void {
        if (!this.currentData) return;
        const target = event.target as HTMLElement;
        const text = Editor.readValue(target);
        const value = target.dataset.arrayJoin
            ? text.split(/\r?\n/).filter(Boolean)
            : text;
        if (this.updateDeep(this.currentData, path, value)) this.onDirty?.();
    }

    private updateDeep(
        object: ResumeLanguageData,
        path: string,
        value: string | string[],
    ): boolean {
        const keys = path.split('.');
        const last = keys.pop();
        if (!last) return false;

        let current: any = object;
        for (const key of keys) {
            if (current[key] === undefined) {
                console.error(`Invalid CV edit path: ${path}`);
                return false;
            }
            current = current[key];
        }
        current[last] = value;
        return true;
    }
}
