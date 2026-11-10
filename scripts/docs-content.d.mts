export function markdownFiles(dir?: string): string[];
export function guideRoute(file: string): string;
export function chapterBody(markdown: string): string;
export function headings(markdown: string): {label: string; id: string; depth: number}[];
export function rewriteLinks(markdown: string, source: string, base?: string): string;
