import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE='https://api.vapi.ai';
export async function vapi(method:string,path:string,body?:unknown):Promise<any>{
  const r=await fetch(BASE+path,{method,cache:'no-store',
    headers:{Authorization:`Bearer ${process.env.VAPI_API_KEY}`,...(body?{'Content-Type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    const m=j?.message;const e:any=new Error(Array.isArray(m)?m.join('; '):typeof m==='string'?m:`Vapi ${method} ${path} failed (${r.status})`);
    e.status=r.status;e.vapiMessage=m;throw e;
  }
  return j;
}
/** Creates an object, and if Vapi says a copied field is not allowed on create, removes it and retries. */
export async function vapiCreateClean(path:string,body:Record<string,any>):Promise<any>{
  const b={...body};
  for(let i=0;i<4;i++){
    try{return await vapi('POST',path,b)}
    catch(e:any){
      const msgs:string[]=Array.isArray(e.vapiMessage)?e.vapiMessage:[];
      const bad=msgs.map(m=>/property (\S+) should not exist/.exec(String(m))?.[1]).filter(Boolean) as string[];
      if(e.status===400&&bad.length&&i<3){bad.forEach(k=>delete b[k]);continue}
      throw e;
    }
  }
}
