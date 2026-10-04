import 'server-only';
type Out={role?:string;content?:string|{text?:string}[]};
export async function vapiChat(assistantId:string,input:string,previousChatId?:string):Promise<{text:string;chatId:string|null}>{
  const r=await fetch('https://api.vapi.ai/chat',{method:'POST',cache:'no-store',
    headers:{Authorization:`Bearer ${process.env.VAPI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({assistantId,input,...(previousChatId?{previousChatId}:{})})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const m=j?.message;throw new Error(Array.isArray(m)?m.join(', '):typeof m==='string'?m:`Vapi chat failed (${r.status})`)}
  const out:Out[]=Array.isArray(j.output)?j.output:[];
  const last=[...out].reverse().find(o=>o.role==='assistant')??out[out.length-1];
  const c=last?.content;
  const text=typeof c==='string'?c:Array.isArray(c)?c.map(x=>x.text??'').join(''):'';
  return{text:text||'(no reply)',chatId:typeof j.id==='string'?j.id:null};
}
