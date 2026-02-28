export function setText(id: string, text: string, dataPath?: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        if (dataPath) el.setAttribute('data-path', dataPath);
    }
}

export function setHTML(id: string, html: string, dataPath?: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = html;
        if (dataPath) el.setAttribute('data-path', dataPath);
    }
}

export function setList<T>(id: string, items: T[] | null | undefined, createItemFn: (item: T, index: number) => HTMLElement): void {
    const el = document.getElementById(id);
    if (!el || !items) return;
    el.innerHTML = '';
    items.forEach((item, index) => {
        el.appendChild(createItemFn(item, index));
    });
}
