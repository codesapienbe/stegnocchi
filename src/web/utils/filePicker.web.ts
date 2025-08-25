import { detectImageContainer } from '@/core/jpgv';

export interface FilePickerResult {
  file: File | null;
  uri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  cancelled: boolean;
}

export interface FilePickerOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  maxFiles?: number;
}

export interface DualUploadResult {
  container: 'jpeg' | 'jpgv' | 'unknown';
  jpegBytes?: Uint8Array;
  jpgvBytes?: Uint8Array;
  fileName?: string;
  mimeType?: string;
}

export interface MultiFilePickerResult {
  files: File[];
  assets: Array<{
    uri: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  cancelled: boolean;
}

function createInput(accept: string, multiple: boolean, capture?: boolean): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  if (capture) input.capture = 'environment';
  input.style.display = 'none';
  document.body.appendChild(input);
  return input;
}

function acceptFor(mediaTypes: 'images' | 'videos' | 'all'): string {
  if (mediaTypes === 'images') return 'image/*';
  if (mediaTypes === 'videos') return 'video/*';
  return '*/*';
}

export async function pickFiles(options: FilePickerOptions = {}): Promise<FilePickerResult> {
  const { mediaTypes = 'images', allowsMultipleSelection = false } = options;
  try {
    const input = createInput(acceptFor(mediaTypes), !!allowsMultipleSelection);
    return await new Promise<FilePickerResult>((resolve) => {
      input.onchange = () => {
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        document.body.removeChild(input);
        if (!file) return resolve({ file: null, cancelled: true });
        const uri = URL.createObjectURL(file);
        resolve({ file, uri, fileName: file.name, fileSize: file.size, mimeType: file.type, cancelled: false });
      };
      input.click();
    });
  } catch {
    return { file: null, cancelled: true };
  }
}

export async function takePhoto(options: FilePickerOptions = {}): Promise<FilePickerResult> {
  // Use capture attribute as a hint; browser support varies
  const { allowsMultipleSelection = false } = options;
  try {
    const input = createInput('image/*', !!allowsMultipleSelection, true);
    return await new Promise<FilePickerResult>((resolve) => {
      input.onchange = () => {
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        document.body.removeChild(input);
        if (!file) return resolve({ file: null, cancelled: true });
        const uri = URL.createObjectURL(file);
        resolve({ file, uri, fileName: file.name, fileSize: file.size, mimeType: file.type, cancelled: false });
      };
      input.click();
    });
  } catch {
    return { file: null, cancelled: true };
  }
}

export function supportsFileAPI(): boolean {
  return typeof File !== 'undefined' && typeof document !== 'undefined';
}

export function getPlatformFilePicker() {
  return pickFiles;
}

export async function loadBytesFromUri(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function detectAndLoadContainerFromUri(uri: string, fileName?: string): Promise<DualUploadResult> {
  const bytes = await loadBytesFromUri(uri);
  const container = detectImageContainer(bytes);
  if (container === 'jpgv') {
    return { container, jpgvBytes: bytes, fileName, mimeType: 'application/octet-stream' };
  } else if (container === 'jpeg') {
    return { container, jpegBytes: bytes, fileName, mimeType: 'image/jpeg' };
  }
  return { container: 'unknown', fileName };
}

export async function pickMultipleFiles(options: FilePickerOptions = {}): Promise<MultiFilePickerResult> {
  const { mediaTypes = 'images', maxFiles = 10 } = options;
  try {
    const input = createInput(acceptFor(mediaTypes), true);
    return await new Promise<MultiFilePickerResult>((resolve) => {
      input.onchange = () => {
        const files: File[] = [];
        const assets: MultiFilePickerResult['assets'] = [];
        const fileList = input.files ? Array.from(input.files).slice(0, maxFiles) : [];
        for (const f of fileList) {
          files.push(f);
          const uri = URL.createObjectURL(f);
          assets.push({ uri, fileName: f.name, fileSize: f.size, mimeType: f.type });
        }
        document.body.removeChild(input);
        resolve({ files, assets, cancelled: files.length === 0 });
      };
      input.click();
    });
  } catch {
    return { files: [], assets: [], cancelled: true };
  }
} 