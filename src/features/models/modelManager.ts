import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_MODEL } from './manifest';
import { voice } from '@/features/voice/voice';

export type ModelProgress = { written: number; total: number; fraction: number };
export type DownloadOutcome={status:'ready';path:string}|{status:'paused'|'cancelled'};
let task: FileSystem.DownloadResumable | null = null;
let resumeData: string | undefined=voice.getPreference('model-download-resume')||undefined;
let modelPath: string | null = null;
let cancelled=false;

function targetPath() {
  if (!FileSystem.documentDirectory) throw new Error('Spazio documenti dell’app non disponibile.');
  return `${FileSystem.documentDirectory}models/${DEFAULT_MODEL.id}.gguf`;
}

export async function installedModelPath(): Promise<string | null> {
  const path=targetPath(); const info=await FileSystem.getInfoAsync(path);
  if(!info.exists) return null;
  if(modelPath===path) return path;
  const valid=await voice.verifyModel(path,DEFAULT_MODEL.sha256).catch(()=>false);
  if(!valid){await FileSystem.deleteAsync(path,{idempotent:true});return null;}
  modelPath=path;return path;
}

export async function downloadModel(onProgress:(progress:ModelProgress)=>void):Promise<DownloadOutcome>{
  if(task)throw new Error('È già attivo un download del modello.');
  const existing=await installedModelPath(); if(existing)return {status:'ready',path:existing};
  cancelled=false;
  if(voice.physicalMemoryBytes()<4_000_000_000)throw new Error('Questo dispositivo ha meno di 4 GB di RAM: il modello non viene installato per evitare instabilità.');
  const free=await FileSystem.getFreeDiskStorageAsync();
  if(free<DEFAULT_MODEL.sizeBytes*1.15)throw new Error('Spazio insufficiente. JOY richiede circa 1,5 GB liberi per scaricare e verificare il modello.');
  const path=targetPath(); const directory=path.slice(0,path.lastIndexOf('/'));
  await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
  task=FileSystem.createDownloadResumable(DEFAULT_MODEL.url,path,{},progress=>{
    const total=progress.totalBytesExpectedToWrite||DEFAULT_MODEL.sizeBytes;
    onProgress({written:progress.totalBytesWritten,total,fraction:total?Math.min(1,progress.totalBytesWritten/total):0});
  },resumeData);
  let result:FileSystem.DownloadResult|undefined;
  try{result=resumeData?await task.resumeAsync():await task.downloadAsync();}
  catch(error){if(!cancelled)throw error;}
  finally{task=null;}
  if(cancelled){cancelled=false;return {status:'cancelled'};}
  if(!result&&resumeData)return {status:'paused'};
  resumeData=undefined;voice.setPreference('model-download-resume','');
  if(!result||result.status<200||result.status>=300)throw new Error('Download del modello interrotto o non riuscito.');
  const valid=await voice.verifyModel(result.uri,DEFAULT_MODEL.sha256);
  if(!valid){await FileSystem.deleteAsync(result.uri,{idempotent:true});throw new Error('SHA-256 non corrispondente: il modello scaricato è stato eliminato.');}
  modelPath=result.uri;return {status:'ready',path:result.uri};
}

export async function pauseModelDownload():Promise<void>{if(!task)return;const state=await task.pauseAsync();resumeData=state.resumeData;voice.setPreference('model-download-resume',resumeData??'');task=null;}
export async function cancelModelDownload():Promise<void>{cancelled=true;if(task){await task.cancelAsync();task=null;}resumeData=undefined;voice.setPreference('model-download-resume','');const path=targetPath();await FileSystem.deleteAsync(path,{idempotent:true});}
export async function deleteInstalledModel():Promise<void>{await cancelModelDownload();modelPath=null;}
export function modelDownloadPaused(){return !!resumeData;}
