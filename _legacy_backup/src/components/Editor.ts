import { ResumeLanguageData } from '../types/resume';

export class Editor {
    private currentData: ResumeLanguageData | null = null;
    public isEditing: boolean = false;
    public onSave: (() => Promise<void>) | null = null;
    private controls: HTMLElement | null = null;

    constructor() {
        this.setupUI();
    }

    public bind(data: ResumeLanguageData): void {
        this.currentData = data;
        if (this.isEditing) {
            this.applyEditable(true);
        }
    }

    private setupUI(): void {
        const container = document.createElement('div');
        container.id = 'editor-controls';
        container.style.cssText = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        display: none; 
        gap: 10px; 
        z-index: 9999;
        padding: 10px;
        background: rgba(0,0,0,0.9);
        border: 1px solid #444;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;

        const saveBtn = document.createElement('button');
        saveBtn.innerText = '💾 Save';
        saveBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 4px; background: #2ecc71; color: white; cursor: pointer; font-weight: bold; transition: all 0.2s;';
        saveBtn.onclick = () => this.save();

        const histBtn = document.createElement('button');
        histBtn.innerText = '📜 History';
        histBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 4px; background: #3498db; color: white; cursor: pointer; font-weight: bold; transition: all 0.2s;';
        histBtn.onclick = () => this.showHistory();

        const closeBtn = document.createElement('button');
        closeBtn.innerText = '❌ Close';
        closeBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 4px; background: #e74c3c; color: white; cursor: pointer; font-weight: bold; transition: all 0.2s;';
        closeBtn.onclick = () => this.toggleEditMode(false);

        container.appendChild(saveBtn);
        container.appendChild(histBtn);
        container.appendChild(closeBtn);
        document.body.appendChild(container);
        this.controls = container;

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.toggleEditMode(!this.isEditing);
            }
        });

        console.log('Editor initialized. Press Ctrl+Shift+E to edit.');
    }

    public async toggleEditMode(active: boolean): Promise<void> {
        if (active && !this.isEditing) {
            const password = prompt('Enter password to edit CV (Default: 0000):');
            if (password !== '0000') {
                alert('Access Denied');
                return;
            }
        }

        this.isEditing = active;
        if (this.controls) {
            this.controls.style.display = active ? 'flex' : 'none';
        }
        this.applyEditable(active);
    }

    private async showHistory(): Promise<void> {
        try {
            const response = await fetch('/api/backups');
            const backups: string[] = await response.json();

            if (backups.length === 0) {
                alert('No backups found yet.');
                return;
            }

            const selection = prompt(
                'Select a backup to restore (index):\n' +
                backups.map((f, i) => `${i}: ${f}`).join('\n')
            );

            if (selection !== null) {
                const idx = parseInt(selection);
                if (!isNaN(idx) && backups[idx]) {
                    const confirmRes = confirm(`Are you sure you want to restore ${backups[idx]}? Current changes will be overwritten.`);
                    if (confirmRes) {
                        const dataRes = await fetch(`/data/backups/${backups[idx]}`);
                        const restoredData = await dataRes.json();

                        const saveRes = await fetch('/api/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(restoredData)
                        });

                        if (saveRes.ok) {
                            alert('Backup restored successfully! Reloading...');
                            window.location.reload();
                        } else {
                            throw new Error('Failed to save restored data');
                        }
                    }
                }
            }
        } catch (e: any) {
            alert('Failed to fetch history: ' + e.message);
        }
    }

    private applyEditable(active: boolean): void {
        const elements = document.querySelectorAll('[data-path]');
        elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            htmlEl.contentEditable = active ? 'true' : 'false';
            if (active) {
                htmlEl.classList.add('editable-highlight');
                htmlEl.oninput = (e: Event) => {
                    const path = htmlEl.getAttribute('data-path');
                    if (path) this.handleInput(e as InputEvent, path);
                };
            } else {
                htmlEl.classList.remove('editable-highlight');
                htmlEl.oninput = null;
            }
        });
    }

    private handleInput(e: Event, path: string): void {
        if (!this.currentData) return;
        const target = e.target as HTMLElement;
        const value = target.innerText;
        this.updateDeep(this.currentData, path, value);
    }

    private updateDeep(obj: any, path: string, value: string): void {
        const keys = path.split('.');
        const last = keys.pop();
        if (!last) return;

        let current = obj;
        for (const key of keys) {
            if (current[key] === undefined) {
                console.error(`Invalid path: ${path}`);
                return;
            }
            current = current[key];
        }
        current[last] = value;
    }

    public async save(): Promise<void> {
        if (!this.controls) return;
        const btn = this.controls.querySelector('button') as HTMLButtonElement;
        const originalText = btn.innerText;
        btn.innerText = 'Saving...';

        if (this.onSave) {
            try {
                await this.onSave();
                btn.innerText = '✅ Saved';
                setTimeout(() => btn.innerText = originalText, 2000);
            } catch (e: any) {
                alert('Save failed: ' + e.message);
                btn.innerText = '❌ Error';
            }
        }
    }
}
