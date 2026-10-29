declare module 'expo-file-system/legacy' {
  export const documentDirectory: string | null;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function getInfoAsync(uri: string): Promise<{ exists: boolean; size?: number; uri?: string }>;
  export function getFreeDiskStorageAsync():Promise<number>;
  export function deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  export type DownloadResult = { uri: string; status: number };
  export type DownloadProgress = { totalBytesWritten: number; totalBytesExpectedToWrite: number };
  export interface DownloadResumable {
    downloadAsync(): Promise<DownloadResult | undefined>;
    pauseAsync(): Promise<{ resumeData?: string }>;
    resumeAsync(): Promise<DownloadResult | undefined>;
    cancelAsync(): Promise<void>;
  }
  export function createDownloadResumable(url: string, fileUri: string, options?: object, callback?: (progress: DownloadProgress) => void, resumeData?: string): DownloadResumable;
}
