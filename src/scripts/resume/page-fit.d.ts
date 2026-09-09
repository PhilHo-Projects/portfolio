export declare const PAGE_HEIGHT_PX: 1056;
export declare const SAFETY_BUFFER_PX: 16;
export declare const PAGE_BUDGET_PX: 1040;
export declare const MAX_DENSITY_STEP: 4;

export type PageFitResult = {
    step: number;
    heightPx: number;
    budgetPx: number;
    fits: boolean;
    overflowPx: number;
    linesToCut: number;
    fillPercent: number;
    stale: boolean;
};

export type PageFitter = {
    fit(): PageFitResult;
    readonly step: number;
};

export declare function createPageFitter(options: {
    measure(): number;
    applyStep(step: number): void;
    getLineHeight(): number;
}): PageFitter;
