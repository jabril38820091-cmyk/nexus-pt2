// Run from the project folder: node tests/usage.test.js
const ts=require('typescript');const fs=require('fs');
const rd=p=>fs.readFileSync(p,'utf8');
const strip=s=>s.replace(/import [^;]*;\n/g,'').replace(/import 'server-only';\n/g,'').replace(/^export /gm,'');
const plansJs="const PLANS=[{key:'receptionist',minutesNum:250},{key:'starter',minutesNum:500},{key:'growth',minutesNum:2000},{key:'full',minutesNum:10000}];\n";
const src=plansJs+strip(rd('lib/tz.ts'))+'\n'+strip(rd('lib/usage.ts'))+'\n'+strip(rd('lib/usage-server.ts'));
const js=ts.transpileModule(src,{compilerOptions:{target:'es2020',module:'commonjs'}}).outputText+'\nmodule.exports={periodBounds,toMinutes,alertLevel,alertToSend,planMinutes,usageForCompany,checkUsageAlerts};';
const db={companies:[],calls:[]};
function chain(t){const f=[];let patch=null,rng=null;
 const rows=()=>db[t].filter(r=>f.every(x=>x(r)));
 const api={select:()=>api,eq:(k,v)=>{f.push(r=>r[k]===v);return api},gte:(k,v)=>{f.push(r=>r[k]>=v);return api},lt:(k,v)=>{f.push(r=>r[k]<v);return api},range:(a,b)=>{rng=[a,b];return api},update:p=>{patch=p;return api},
  maybeSingle:async()=>({data:rows()[0]??null}),
  then:(res)=>{if(patch){rows().forEach(r=>Object.assign(r,patch));return res({error:null})}let d=rows();if(rng)d=d.slice(rng[0],rng[1]+1);res({data:d})}};return api}
const supabaseAdmin={from:chain,auth:{admin:{getUserById:async()=>({data:{user:{email:'owner@example.com'}}})}}};
const fired=[];const fireEvent=async(c,e,d)=>fired.push([c,e,d]);
const sent=[];const fetch=async(u,o)=>{sent.push(JSON.parse(o.body));return{ok:true,json:async()=>({})}};
process.env.RESEND_API_KEY='re_test';process.env.NEXT_PUBLIC_APP_URL='https://example.test';
const m={exports:{}};new Function('module','exports','supabaseAdmin','fireEvent','fetch','process',js)(m,m.exports,supabaseAdmin,fireEvent,fetch,process);
const {periodBounds,toMinutes,alertLevel,alertToSend,planMinutes,usageForCompany,checkUsageAlerts}=m.exports;
let fails=0;const ok=(n,c)=>{if(!c){fails++;console.log('FAIL',n)}};
const NOW=new Date('2026-10-17T18:00:00Z');
// periods
let p=periodBounds({start:'2026-10-05T12:00:00Z',end:'2026-11-05T12:00:00Z'},NOW);
ok('uses Stripe dates when inside them',p.start.toISOString()==='2026-10-05T12:00:00.000Z'&&p.end.toISOString()==='2026-11-05T12:00:00.000Z');
p=periodBounds({start:null,end:'2026-11-05T12:00:00Z'},NOW);ok('derives start from end alone',p.start.toISOString()==='2026-10-05T12:00:00.000Z');
p=periodBounds({tz:'America/Chicago'},NOW);ok('calendar month in the business time zone',p.start.toISOString()==='2026-10-01T05:00:00.000Z'&&p.end.toISOString()==='2026-11-01T05:00:00.000Z');
p=periodBounds({tz:'America/Chicago'},new Date('2026-12-20T18:00:00Z'));ok('December rolls into January',p.end.toISOString()==='2027-01-01T06:00:00.000Z');
p=periodBounds({start:'2026-08-01T00:00:00Z',end:'2026-09-01T00:00:00Z',tz:'UTC'},NOW);ok('expired Stripe dates fall back to the calendar month',p.start.toISOString()==='2026-10-01T00:00:00.000Z');
// math
ok('rounds up to whole minutes',toMinutes(61)===2&&toMinutes(60)===1&&toMinutes(0)===0&&toMinutes(-5)===0);
ok('plan minutes',planMinutes('receptionist')===250&&planMinutes('full')===10000&&planMinutes(null)===null);
ok('levels',alertLevel(199,250)===0&&alertLevel(200,250)===80&&alertLevel(250,250)===100&&alertLevel(999,null)===0);
const ps=new Date('2026-10-01T00:00:00Z');
ok('first crossing of 80%',alertToSend({used:200,limit:250,lastLevel:0,lastPeriod:null,periodStart:ps})===80);
ok('no repeat at 80%',alertToSend({used:210,limit:250,lastLevel:80,lastPeriod:ps.toISOString(),periodStart:ps})===0);
ok('then 100%',alertToSend({used:250,limit:250,lastLevel:80,lastPeriod:ps.toISOString(),periodStart:ps})===100);
ok('no repeat at 100%',alertToSend({used:400,limit:250,lastLevel:100,lastPeriod:ps.toISOString(),periodStart:ps})===0);
ok('new period starts fresh',alertToSend({used:200,limit:250,lastLevel:100,lastPeriod:'2026-09-01T00:00:00Z',periodStart:ps})===80);
ok('no plan, no warning',alertToSend({used:5000,limit:null,lastLevel:0,lastPeriod:null,periodStart:ps})===0);
// counting across many calls, only this business, only this period
const co={id:'c1',plan:'receptionist',subscription_status:'active',timezone:'UTC',current_period_start:'2026-10-01T00:00:00Z',current_period_end:'2026-11-01T00:00:00Z',owner_id:'u1',usage_alert_level:0,usage_alert_period:null};
db.companies.push(co,{id:'c2',plan:'starter',subscription_status:'active',timezone:'UTC',current_period_start:null,current_period_end:null});
for(let i=0;i<1500;i++)db.calls.push({company_id:'c1',duration_seconds:6,created_at:'2026-10-10T10:00:00Z'});   // 9000 s = 150 min
db.calls.push({company_id:'c1',duration_seconds:6000,created_at:'2026-09-20T10:00:00Z'});  // last period: ignored
db.calls.push({company_id:'c2',duration_seconds:60000,created_at:'2026-10-10T10:00:00Z'}); // another business: ignored
db.calls.push({company_id:'c1',duration_seconds:null,created_at:'2026-10-11T10:00:00Z'});   // unknown length: counts as 0
(async()=>{
 let u=await usageForCompany(co,NOW);
 ok('counts more than 1,000 calls',u.used===150&&u.limit===250);
 await checkUsageAlerts('c1',NOW);ok('under 80%: no email',sent.length===0&&fired.length===0);
 for(let i=0;i<500;i++)db.calls.push({company_id:'c1',duration_seconds:6,created_at:'2026-10-12T10:00:00Z'});  // +50 min = 200 (80%)
 await checkUsageAlerts('c1',NOW);
 ok('80% email sent once',sent.length===1&&sent[0].subject.includes('80%')&&sent[0].text.includes('200 of the 250')&&sent[0].to[0]==='owner@example.com');
 ok('80% event fired',fired.length===1&&fired[0][1]==='usage.alert'&&fired[0][2].level===80);
 await checkUsageAlerts('c1',NOW);ok('no duplicate email',sent.length===1);
 for(let i=0;i<500;i++)db.calls.push({company_id:'c1',duration_seconds:6,created_at:'2026-10-13T10:00:00Z'});  // 250 = 100%
 await checkUsageAlerts('c1',NOW);ok('100% email says calls continue',sent.length===2&&sent[1].subject.includes('all your call minutes')&&sent[1].text.includes('keep being answered')&&sent[1].text.includes('https://example.test/billing'));
 // next billing period
 co.current_period_start='2026-11-01T00:00:00Z';co.current_period_end='2026-12-01T00:00:00Z';
 const NOV=new Date('2026-11-20T00:00:00Z');
 for(let i=0;i<2000;i++)db.calls.push({company_id:'c1',duration_seconds:6,created_at:'2026-11-10T10:00:00Z'}); // 200 min in November
 await checkUsageAlerts('c1',NOV);ok('new period warns again at 80%',sent.length===3&&sent[2].subject.includes('80%'));
 u=await usageForCompany({...co,subscription_status:'canceled'},NOV);ok('canceled plan falls back to the calendar month',u.periodStart==='2026-11-01T00:00:00.000Z');
 const before=sent.length;delete process.env.RESEND_API_KEY;db.companies[1].usage_alert_level=0;
 await checkUsageAlerts('c2',NOW);ok('no email service: still records the warning, never crashes',sent.length===before&&db.companies[1].usage_alert_level===100);
 console.log(fails?'FAILED '+fails:'all usage checks pass');
})();
