import { Platform } from 'react-native';
import type { ChatMessage } from './types';
export type { ChatMessage } from './types';
export type SavedMemory={id:string;label:string;createdAt:number};

let memory: ChatMessage[] = [];
let savedMemories:SavedMemory[]=[];

/** Privacy-local persistence. Uses SQLite when expo-sqlite is installed; otherwise falls back to volatile memory. */
export async function listMessages(): Promise<ChatMessage[]> {
  const sqlite = await loadSQLite();
  if (sqlite) {
    const db = await database(sqlite);
    const rows = await db.getAllAsync<{id:string;role:'user'|'assistant';text:string;created_at:number}>('SELECT id, role, text, created_at FROM messages ORDER BY created_at ASC');
    return rows.map(({created_at,...row})=>({...row,createdAt:created_at}));
  }
  return [...memory];
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const sqlite = await loadSQLite();
  if (sqlite) {
    const db = await database(sqlite);
    await db.runAsync('INSERT OR REPLACE INTO messages (id, role, text, created_at) VALUES (?, ?, ?, ?)', message.id, message.role, message.text, message.createdAt);
    return;
  }
  memory = [...memory.filter(item=>item.id!==message.id),message];
}

export async function clearMessages(): Promise<void> {
  const sqlite = await loadSQLite();
  if (sqlite) await (await database(sqlite)).runAsync('DELETE FROM messages');
  memory = [];
}

export async function listMemories():Promise<SavedMemory[]>{
  const sqlite=await loadSQLite();
  if(sqlite){const rows=await (await database(sqlite)).getAllAsync<{id:string;label:string;created_at:number}>('SELECT id,label,created_at FROM memories ORDER BY created_at DESC');return rows.map(({created_at,...row})=>({...row,createdAt:created_at}));}
  return [...savedMemories];
}
export async function saveMemory(label:string):Promise<SavedMemory>{
  const clean=label.trim();if(!clean)throw new Error('La memoria non può essere vuota.');
  const item={id:`m-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,label:clean,createdAt:Date.now()};
  const sqlite=await loadSQLite();if(sqlite)await (await database(sqlite)).runAsync('INSERT INTO memories (id,label,created_at) VALUES (?,?,?)',item.id,item.label,item.createdAt);else savedMemories=[item,...savedMemories];
  return item;
}
export async function deleteMemory(id:string):Promise<void>{const sqlite=await loadSQLite();if(sqlite)await (await database(sqlite)).runAsync('DELETE FROM memories WHERE id=?',id);savedMemories=savedMemories.filter(item=>item.id!==id);}
export async function clearMemories():Promise<void>{const sqlite=await loadSQLite();if(sqlite)await (await database(sqlite)).runAsync('DELETE FROM memories');savedMemories=[];}

type SQLiteModule = typeof import('expo-sqlite');
let sqliteModule: Promise<SQLiteModule | null> | undefined;
let databasePromise: Promise<import('expo-sqlite').SQLiteDatabase> | undefined;
async function loadSQLite(): Promise<SQLiteModule | null> {
  // Avoid the native import on web; dynamically loaded so a missing optional package doesn't break typecheck.
  if (Platform.OS === 'web') return null;
  sqliteModule ??= import('expo-sqlite').catch(()=>null);
  return sqliteModule;
}
async function database(sqlite: SQLiteModule) {
  databasePromise ??= (async()=>{
    const db=await sqlite.openDatabaseAsync('joy.db');
    await db.execAsync('CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL)');
    await db.execAsync('CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL)');
    return db;
  })();
  return databasePromise;
}
