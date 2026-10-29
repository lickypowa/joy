export type LocalIntent=
  | {kind:'weather';city:string|null;tomorrow:boolean}
  | {kind:'reminder';title:string;dayOffset:number;hour:number;minute:number}
  | {kind:'navigation';destination:string}
  | {kind:'contact';query:string}
  | {kind:'message';recipient:string;body:string}
  | {kind:'chat'};

export function parseIntent(text:string):LocalIntent{
  if(/\b(che tempo|meteo|piove|temperatura)\b/i.test(text)){
    const match=text.match(/\b(?:a|di|per)\s+([\p{L}][\p{L}' -]{1,35}?)(?=\s+(?:domani|oggi|dopodomani)\b|[?.!,]|$)/iu);
    return {kind:'weather',city:match?.[1]?.trim()??null,tomorrow:/\bdomani\b/i.test(text)};
  }
  if(/\b(ricordami|promemoria)\b/i.test(text)){
    const title=text.replace(/^.*?\b(?:ricordami(?:\s+di)?|promemoria(?:\s+per)?)\s*/i,'').replace(/\b(?:oggi|domani|dopodomani)\b/ig,'').replace(/\b(?:alle|ore)\s+\d{1,2}(?::\d{2})?\b/ig,'').replace(/^[\s,]+|[?.!,]+$/g,'').replace(/^di\s+/i,'').trim();
    const time=text.match(/\b(?:alle|ore)\s+(\d{1,2})(?::(\d{2}))?\b/i);
    return {kind:'reminder',title,dayOffset:/\bdopodomani\b/i.test(text)?2:/\bdomani\b/i.test(text)?1:0,hour:time?Number(time[1]):9,minute:time?.[2]?Number(time[2]):0};
  }
  if(/\b(portami|naviga|percorso|indicazioni|aprimi il percorso)\b/i.test(text)){
    const destination=text.replace(/^.*?\b(?:portami(?:\s+al(?:la)?)?|naviga(?:\s+verso)?|indicazioni\s+per|percorso\s+per|aprimi\s+il\s+percorso\s+per)\s*/i,'').replace(/[?.!,]+$/,'').trim();
    return {kind:'navigation',destination};
  }
  const prepared=text.match(/\b(?:prepara|scrivi|manda|invia)\s+(?:un\s+)?messaggio\s+(?:a|per)\s+([^:,]+)\s*[:,]\s*(.+)$/i)
    ??text.match(/\b(?:scrivi|manda|invia)\s+(?:a|al|alla)\s+(.+?)\s+che\s+(.+)$/i);
  if(prepared)return {kind:'message',recipient:prepared[1].trim(),body:prepared[2].trim().replace(/[?.!,]+$/,'')};
  if(/\b(?:trova|cerca|recupera|qual\s+è)\b.*\b(?:numero|contatto)\b|\bnumero\s+di\b/i.test(text)){
    const query=text.replace(/^.*?\b(?:trova|cerca|recupera|qual\s+è)\s*/i,'').replace(/^il\s+/i,'').replace(/^(?:numero|contatto)\s+(?:(?:di|per)\s*)?/i,'').replace(/^(?:di|per)\s+/i,'').replace(/[?.!,]+$/,'').trim();
    return {kind:'contact',query};
  }
  return {kind:'chat'};
}
