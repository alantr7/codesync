const PREVIEWS: Record<string, PREVIEW_MODES> = {
    "pdf":      "PDF",

    "png":      "IMAGE",
    "jpg":      "IMAGE",

    "md":       "DOCUMENT",
    "html":     "DOCUMENT",
    "java":     "DOCUMENT",
    "js":       "DOCUMENT",
    "ts":       "DOCUMENT",
    "json":     "DOCUMENT",
    "tsx":      "DOCUMENT",
    "css":      "DOCUMENT",
    "scss":     "DOCUMENT",
}
export type PREVIEW_MODES = "IMAGE" | "DOCUMENT" | "PDF" | "BINARY";
export function getPreviewMode(name: string): PREVIEW_MODES {
    const extIndex = name.lastIndexOf('.');
    if (extIndex === -1)
        return "BINARY";

    const ext = name.substring(extIndex + 1);
    return PREVIEWS[ext] || "BINARY";
}