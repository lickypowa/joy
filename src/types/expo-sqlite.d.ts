declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(source: string): Promise<void>;
    getAllAsync<T>(source: string): Promise<T[]>;
    runAsync(source: string, ...params: (string | number | null)[]): Promise<unknown>;
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}
