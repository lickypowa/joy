import { OfflineProvider } from '@/core/ai/OfflineProvider';
import type { Turn } from '@/core/ai/LLMProvider';
import { localLlamaProvider } from '@/core/ai/LocalLlamaProvider';
import { installedModelPath } from '@/features/models/modelManager';
import { getTomorrowWeather, getWeather } from '@/features/weather/weather';
import { listMemories } from '@/features/conversation/repository';
import { voice } from '@/features/voice/voice';
import { Linking, Platform } from 'react-native';
import { parseIntent } from './intents';

const offline = new OfflineProvider();
const locations:Record<string,[number,number]>={palermo:[38.1157,13.3615],milano:[45.4642,9.19],roma:[41.9028,12.4964],napoli:[40.8518,14.2681],torino:[45.0703,7.6869],catania:[37.5079,15.083]};

/** Tool intents execute through explicit app capabilities; general answers use the local GGUF model when loaded. */
export async function respond(turns: Turn[], onToken?:(token:string)=>void): Promise<string> {
  const intent=parseIntent(turns.at(-1)?.content.trim()??'');
  if(intent.kind==='reminder') return createReminder(intent.title,intent.dayOffset,intent.hour,intent.minute);
  if(intent.kind==='navigation') return openNavigation(intent.destination);
  if(intent.kind==='message') return prepareTextMessage(intent.recipient,intent.body);
  if(intent.kind==='contact') return findContact(intent.query);
  if(intent.kind==='weather'){
    const city=intent.city??(/\bpalermo\b/i.test(turns.at(-1)?.content??'')?'Palermo':null);
    if(!city)return 'Per controllare il meteo dimmi la città. La richiesta meteo usa Open-Meteo; il modello resta sul dispositivo.';
    const coordinates=locations[city.toLocaleLowerCase('it-IT')];
    if(!coordinates)return `Non ho ancora coordinate verificate per ${city}. Posso cercare Palermo, Milano, Roma, Napoli, Torino o Catania.`;
    try{
      const report=intent.tomorrow?await getTomorrowWeather(...coordinates,city):await getWeather(...coordinates,city);
      const description=describeWeather(report.code);
      if(intent.tomorrow)return `Domani a ${report.place}: ${description}, tra ${Math.round(report.minTemperature!)}°C e ${Math.round(report.maxTemperature!)}°C.${report.rainChance==null?'':` Probabilità massima di pioggia: ${report.rainChance}%.`}`;
      return `A ${report.place} adesso ci sono ${Math.round(report.temperature)}°C e ${description}.${report.rainChance==null?'':` Probabilità massima di pioggia oggi: ${report.rainChance}%.`}`;
    }catch{return 'Non riesco a raggiungere il servizio meteo in questo momento. Le altre funzioni locali restano disponibili.';}
  }
  // Load a previously installed GGUF on demand, even if the user has not
  // opened Settings since launching the app.
  if(!await localLlamaProvider.isAvailable()){
    try{
      const modelPath=await installedModelPath();
      if(modelPath)await localLlamaProvider.load(modelPath);
    }catch{/* Keep the usable offline intent fallback if local loading fails. */}
  }
  if(await localLlamaProvider.isAvailable()){
    try{
      const memories=voice.getPreference('memory-enabled')==='true'?await listMemories():[];
      const memoryContext=memories.length?`\nPreferenze personali salvate esplicitamente dall’utente (usale solo se pertinenti):\n${memories.map(item=>`- ${item.label}`).join('\n')}`:'';
      return await localLlamaProvider.generate([
        {role:'system',content:`Sei JOY, un assistente personale chiaro, utile e prudente. Rispondi in italiano, con tono naturale e conciso. Non sostenere di aver eseguito azioni se il risultato non è stato confermato dagli strumenti. Non inventare informazioni attuali.${memoryContext}`},
        ...turns.slice(-12),
      ],onToken);
    }catch{return 'Il modello locale ha avuto un problema durante la risposta. Riprova oppure ricarica il modello dalle impostazioni.';}
  }
  return offline.generate(turns);
}

async function createReminder(title:string,dayOffset:number,hour:number,minute:number):Promise<string>{
  if(!title)return 'Dimmi cosa vuoi che ti ricordi, per esempio: “Ricordami di comprare il latte domani alle 9”.';
  if(Platform.OS!=='ios'||!voice.available)return 'La creazione dei promemoria richiede la build iOS nativa con JOY. Posso comunque aiutarti a preparare il testo.';
  const due=new Date();due.setDate(due.getDate()+dayOffset);due.setHours(hour,minute,0,0);
  try{
    if(!await voice.requestRemindersPermission())return 'Non ho il permesso di creare promemoria. Puoi abilitarlo nelle Impostazioni di iOS e riprovare.';
    const result=await voice.createReminder(title,due.getTime()/1000);
    if(result.status==='duplicate')return `Esiste già un promemoria simile: “${title}”.`;
    return `Promemoria creato: “${title}”, ${due.toLocaleDateString('it-IT')} alle ${due.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}.`;
  }catch{return 'Non sono riuscita a salvare il promemoria. Controlla i permessi e riprova.';}
}

async function openNavigation(destination:string):Promise<string>{
  if(!destination)return 'Dove vuoi andare? Indicami una destinazione, per esempio “Portami al Teatro Massimo”.';
  const url=Platform.OS==='ios'?`http://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`:Platform.OS==='android'?`google.navigation:q=${encodeURIComponent(destination)}`:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  try{await Linking.openURL(url);return `Ho aperto la navigazione verso ${destination}. Verifica il luogo nell’app mappe prima di partire.`;}
  catch{return 'Non è stato possibile aprire un’app di navigazione su questo dispositivo.';}
}

async function findContact(query:string):Promise<string>{
  if(!query)return 'Dimmi il nome della persona che vuoi cercare.';
  if(Platform.OS!=='ios'||!voice.available)return 'La ricerca nei Contatti richiede la build nativa iOS.';
  try{
    if(!await voice.requestContactsPermission())return 'Non ho il permesso di accedere ai Contatti. Puoi abilitarlo nelle Impostazioni di iOS.';
    const contacts=await voice.findContacts(query);
    if(!contacts.length)return `Non ho trovato contatti corrispondenti a “${query}”.`;
    const named=contacts.map(contact=>({name:`${contact.givenName} ${contact.familyName}`.trim(),phone:contact.phone}));
    const uniqueNames=[...new Set(named.map(contact=>contact.name))];
    if(uniqueNames.length>1)return `Ho trovato più persone chiamate “${query}”: ${uniqueNames.slice(0,5).join(', ')}. Dimmi il cognome per scegliere.`;
    const phones=[...new Set(named.map(contact=>contact.phone).filter(Boolean))];
    if(!phones.length)return `Ho trovato ${uniqueNames[0]}, ma non c’è un numero salvato nel contatto.`;
    if(phones.length>1)return `Ho trovato più numeri per ${uniqueNames[0]}: ${phones.join(', ')}.`;
    return `Il numero di ${uniqueNames[0]} è ${phones[0]}.`;
  }catch{return 'Non sono riuscita a cercare nei Contatti. Verifica il permesso e riprova.';}
}

async function prepareTextMessage(recipient:string,body:string):Promise<string>{
  if(!recipient||!body)return 'Indicami il destinatario e il testo, per esempio: “Prepara un messaggio per Marco: arrivo tra dieci minuti”.';
  if(Platform.OS!=='ios'||!voice.available)return 'La preparazione del messaggio richiede la build iOS nativa con JOY.';
  try{
    if(!await voice.requestContactsPermission())return 'Per scegliere il destinatario mi serve il permesso Contatti.';
    const contacts=await voice.findContacts(recipient);
    const named=contacts.map(contact=>({name:`${contact.givenName} ${contact.familyName}`.trim(),phone:contact.phone}));
    const names=[...new Set(named.map(contact=>contact.name))];
    if(names.length>1)return `Ho trovato più contatti: ${names.slice(0,5).join(', ')}. Specifica il cognome.`;
    const number=[...new Set(named.map(contact=>contact.phone).filter(Boolean))];
    if(!names.length)return `Non ho trovato “${recipient}” nei Contatti.`;
    if(!number.length)return `Il contatto ${names[0]} non ha un numero di telefono.`;
    if(number.length>1)return `Il contatto ${names[0]} ha più numeri. Specifica quale vuoi usare.`;
    const phone=number[0].replace(/[^\d+]/g,'');
    const url=`sms:${phone}&body=${encodeURIComponent(body)}`;
    await Linking.openURL(url);
    return `Ho preparato un SMS per ${names[0]} con il testo richiesto. Controllalo e premi Invia nell’app Messaggi.`;
  }catch{return 'Non è stato possibile aprire la composizione del messaggio. Nessun messaggio è stato inviato.';}
}

function describeWeather(code:number):string{
  if(code===0)return 'cielo sereno';if([1,2,3].includes(code))return 'nuvoloso';if([45,48].includes(code))return 'nebbia';if([51,53,55,56,57].includes(code))return 'pioviggine';if([61,63,65,66,67,80,81,82].includes(code))return 'pioggia';if([71,73,75,77,85,86].includes(code))return 'neve';if([95,96,99].includes(code))return 'temporale';return 'condizioni variabili';
}
