import 'server-only';
import {createCipheriv,createDecipheriv,randomBytes} from 'crypto';
function key():Buffer{
  const k=process.env.APP_ENCRYPTION_KEY;
  if(!k)throw new Error('APP_ENCRYPTION_KEY is not set on the server. Make one on the Admin page and add it in Vercel.');
  const b=Buffer.from(k,'base64');
  if(b.length!==32)throw new Error('APP_ENCRYPTION_KEY must be 32 bytes, base64 encoded.');
  return b;
}
/** Encrypts a secret before it is stored. Output: iv.tag.ciphertext, each base64. */
export function encrypt(text:string):string{
  const iv=randomBytes(12);const c=createCipheriv('aes-256-gcm',key(),iv);
  const enc=Buffer.concat([c.update(text,'utf8'),c.final()]);
  return [iv,c.getAuthTag(),enc].map(b=>b.toString('base64')).join('.');
}
export function decrypt(s:string):string{
  const [iv,tag,enc]=s.split('.').map(x=>Buffer.from(x,'base64'));
  const d=createDecipheriv('aes-256-gcm',key(),iv);d.setAuthTag(tag);
  return Buffer.concat([d.update(enc),d.final()]).toString('utf8');
}
