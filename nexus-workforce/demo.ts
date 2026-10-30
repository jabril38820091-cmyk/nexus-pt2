import {normalizePhone} from '@/lib/phone';
export const BUSINESS_TYPES=['Salon or barbershop','Contractor or home services','Restaurant or cafe','Other'] as const;
export type DemoInput={name:string;business:string;email:string;phone:string|null;businessType:string;message:string|null;source:string|null};
const clean=(v:unknown,max:number)=>String(v??'').replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Checks and tidies a demo request. Returns the clean request or a list of problems in plain words. */
export function validateDemo(b:Record<string,unknown>):{ok:true;value:DemoInput}|{ok:false;errors:string[]}{
  const errors:string[]=[];
  const name=clean(b.name,80),business=clean(b.business,120),email=clean(b.email,200).toLowerCase();
  const rawPhone=clean(b.phone,40),businessType=clean(b.businessType,60);
  const message=String(b.message??'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g,'').trim().slice(0,1000)||null;
  if(name.length<2)errors.push('Please enter your name.');
  if(business.length<2)errors.push('Please enter your business name.');
  if(!EMAIL.test(email))errors.push('Please enter a valid email address.');
  const phone=rawPhone?normalizePhone(rawPhone):null;
  if(rawPhone&&!phone)errors.push('That phone number does not look right. You can leave it empty.');
  if(!(BUSINESS_TYPES as readonly string[]).includes(businessType))errors.push('Please choose your type of business.');
  if(b.consent!==true)errors.push('Please agree to be contacted about your demo.');
  const source=clean(b.source,200)||null;
  return errors.length?{ok:false,errors}:{ok:true,value:{name,business,email,phone,businessType,message,source}};
}
/** Hidden-field and too-fast checks that stop most automated spam without a puzzle for real people. */
export function looksAutomated(b:Record<string,unknown>,now=Date.now()):boolean{
  if(String(b.website??'').trim())return true;
  const t=Number(b.startedAt);
  return !Number.isFinite(t)||now-t<3000||now-t>86400_000;
}
