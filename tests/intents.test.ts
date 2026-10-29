import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseIntent } from '../src/features/assistant/intents.ts';

describe('assistant intent parsing',()=>{
  it('parses lowercase city names and relative forecast requests',()=>{
    assert.deepEqual(parseIntent('Che tempo farà domani a palermo?'),{kind:'weather',city:'palermo',tomorrow:true});
    assert.deepEqual(parseIntent('meteo a milano'),{kind:'weather',city:'milano',tomorrow:false});
  });
  it('extracts reminder title and local time/date',()=>{
    assert.deepEqual(parseIntent('Ricordami di comprare il latte domani alle 9:30'),{kind:'reminder',title:'comprare il latte',dayOffset:1,hour:9,minute:30});
    assert.deepEqual(parseIntent('Promemoria per chiamare Marco dopodomani'),{kind:'reminder',title:'chiamare Marco',dayOffset:2,hour:9,minute:0});
  });
  it('extracts map destinations without interpreting free text as a tool call',()=>{
    assert.deepEqual(parseIntent('Portami al Teatro Massimo'),{kind:'navigation',destination:'Teatro Massimo'});
    assert.deepEqual(parseIntent('Parlami delle mappe'),{kind:'chat'});
  });
  it('prepares a message without sending it',()=>{
    assert.deepEqual(parseIntent('Prepara un messaggio per Marco: arrivo tra dieci minuti'),{kind:'message',recipient:'Marco',body:'arrivo tra dieci minuti'});
    assert.deepEqual(parseIntent('Scrivi a Marco che arrivo tra dieci minuti'),{kind:'message',recipient:'Marco',body:'arrivo tra dieci minuti'});
  });
});
