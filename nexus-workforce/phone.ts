export const E164=/^\+[1-9]\d{7,14}$/;
/** Turns what a person typed or said into +E.164, or null. US numbers without a country code get +1. */
export function normalizePhone(raw:string):string|null{
  const s=String(raw??'').trim();
  const digits=s.replace(/\D/g,'');
  let out:string;
  if(s.startsWith('+'))out='+'+digits;
  else if(digits.length===10)out='+1'+digits;
  else if(digits.length===11&&digits.startsWith('1'))out='+'+digits;
  else return null;
  return E164.test(out)?out:null;
}
/** Finds the caller's number in a follow-up draft's notes, e.g. "Caller: +1 (612) 555-0123". */
export function callerFromNotes(notes:string|null|undefined):string|null{
  const m=/Caller:\s*(\+?[\d\s().-]{7,20})/.exec(notes??'');
  return m?normalizePhone(m[1]):null;
}
