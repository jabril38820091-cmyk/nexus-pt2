/** Business details shown on the legal pages. Set these in Vercel (type Config), then redeploy. */
export const LEGAL={
  product:'Nexus Workforce',
  name:process.env.NEXT_PUBLIC_LEGAL_NAME||'',
  email:process.env.NEXT_PUBLIC_CONTACT_EMAIL||'',
  address:process.env.NEXT_PUBLIC_LEGAL_ADDRESS||'',
  law:process.env.NEXT_PUBLIC_GOVERNING_LAW||'',
  updated:'October 16, 2026'};
export const ph=(v:string,label:string)=>v||`[${label}]`;
export const missingDetails=()=>[['company name',LEGAL.name],['contact email',LEGAL.email],['address',LEGAL.address],['governing law',LEGAL.law]].filter(([,v])=>!v).map(([k])=>k);
