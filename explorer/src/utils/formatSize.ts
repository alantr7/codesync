const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;
const GIGABYTE = MEGABYTE * 1024;

const HALF_KILOBYTE = KILOBYTE / 2;
const HALF_MEGABYTE = MEGABYTE / 2;
const HALF_GIGABYTE = GIGABYTE / 2;

export function formatSize(size: number): string {
    if (size >= HALF_GIGABYTE)
        return (size / GIGABYTE).toFixed(1) + " GB";

    if (size >= HALF_MEGABYTE)
        return (size / MEGABYTE).toFixed(1) + " MB";

    if (size >= HALF_KILOBYTE)
        return (size / KILOBYTE).toFixed(1) + " KB";

    return size + " bytes";
}