// Harbour TV fetcher — YouTube Data API v3. Usage: YOUTUBE_API_KEY=... node fetch-videos.mjs [out.json]
import fs from 'fs'; import path from 'path';
const dir=path.dirname(new URL(import.meta.url).pathname);
const C=JSON.parse(fs.readFileSync(path.join(dir,'config.json')));
const OUT=process.argv[2]||path.join(dir,'videos.json');
const K=process.env.YOUTUBE_API_KEY; if(!K){console.error('YOUTUBE_API_KEY missing');process.exit(1)}
let units=0;
async function api(ep,params,cost=1){units+=cost;const u=new URL('https://www.googleapis.com/youtube/v3/'+ep);
 for(const[k,v]of Object.entries(params))u.searchParams.set(k,v);u.searchParams.set('key',K);
 const r=await fetch(u);if(!r.ok)throw new Error(ep+' '+r.status);return r.json()}
const cachePath=path.join(dir,'channel-cache.json');
const cache=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath)):{};
async function uploads(h){ if(!cache[h]){const p=h.startsWith('@')?{forHandle:h}:{id:h};
  const d=await api('channels',{part:'contentDetails,snippet',...p});const c=d.items?.[0];
  cache[h]=c?{id:c.id,title:c.snippet.title,uploads:c.contentDetails.relatedPlaylists.uploads}:null}
 return cache[h]}
const iso=s=>{const m=s?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)||[];return(+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0)};
const state=fs.existsSync(path.join(dir,'state.json'))?JSON.parse(fs.readFileSync(path.join(dir,'state.json'))):{rot:0};
const groups={...Object.fromEntries(Object.entries(C.sections).map(([k,v])=>['s:'+k,v])),...Object.fromEntries(Object.entries(C.brands).map(([k,v])=>['b:'+k,v]))};
const allQ=Object.entries(groups).flatMap(([g,v])=>(v.queries||[]).map(q=>[g,q]));
const qs=Array.from({length:Math.min(C.searchesPerRun,allQ.length)},(_,i)=>allQ[(state.rot+i)%allQ.length]);
const since=new Date(Date.now()-30*864e5).toISOString();
const cand={}; // id -> Set(groups)
const add=(id,g,allow)=>{(cand[id]??={g:new Set(),allow:false}).g.add(g);if(allow)cand[id].allow=true};
for(const[g,v]of Object.entries(groups)){
 for(const h of [...(v.handles||[]),...(v.channelIds||[])]){const c=await uploads(h);if(!c){console.warn('no channel',h);continue}
  let d;try{d=await api('playlistItems',{part:'contentDetails',playlistId:c.uploads,maxResults:50})}catch(e){console.warn('skip',h,e.message);continue}
  for(const it of d.items||[])add(it.contentDetails.videoId,g,true)}}
for(const[g,q]of qs){const d=await api('search',{part:'id',type:'video',q,maxResults:25,order:'date',publishedAfter:since,relevanceLanguage:'en',safeSearch:'strict',videoEmbeddable:'true'},100);
 for(const it of d.items||[])add(it.id.videoId,g,false)}
const ids=Object.keys(cand),vids={};
for(let i=0;i<ids.length;i+=50){const d=await api('videos',{part:'snippet,contentDetails,statistics,status',id:ids.slice(i,i+50).join(',')});
 for(const v of d.items||[])vids[v.id]=v}
const now=Date.now(),blk=C.block.map(s=>s.toLowerCase());
const out={generated:new Date().toISOString(),sections:{},brands:{}};
const used=new Set();
for(const[g,v]of Object.entries(groups)){
 const list=[];
 for(const[id,c]of Object.entries(cand)){if(!c.g.has(g))continue;const x=vids[id];if(!x)continue;
  const s=x.snippet,dur=iso(x.contentDetails.duration),views=+x.statistics.viewCount||0;
  const text=(s.title+' '+s.description).toLowerCase();
  if(x.status.privacyStatus!=='public'||!x.status.embeddable||x.status.madeForKids)continue;
  if(s.liveBroadcastContent!=='none'||dur===0)continue;
  if(blk.some(b=>text.includes(b)))continue;
  if((now-Date.parse(s.publishedAt))/864e5>(c.allow?C.maxAgeDays:90))continue;
  const lang=(s.defaultAudioLanguage||s.defaultLanguage||'');
  if(!c.allow&&lang&&!lang.startsWith('en'))continue;
  if(!c.allow&&/[^\x00-\u024f\u2000-\u2bff\u{1F000}-\u{1FFFF}]/u.test(s.title))continue;
  if(v.titleMust&&!text.includes(v.titleMust))continue;
  const short=dur<=180&&(dur<=60||/#shorts?\b/.test(text));
  if(!c.allow&&views<(short?C.minViewsShort:C.minViewsFull))continue;
  if(!short&&dur<120)continue;
  list.push({id,title:s.title,channel:s.channelTitle,channelId:s.channelId,published:s.publishedAt,duration:dur,views,short,
   thumb:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,description:(s.description||'').slice(0,240)})}
 list.sort((a,b)=>b.published.localeCompare(a.published));
 const pick=short=>{const per={},r=[];for(const x of list){if(x.short!==short)continue;
  if(g.startsWith('s:')&&used.has(x.id))continue;if((per[x.channelId]=(per[x.channelId]||0)+1)>(g.startsWith("s:")?C.maxPerChannel:99))continue;
  r.push(x);if(g.startsWith('s:'))used.add(x.id);if(r.length>=C.perBlock)break}return r};
 const [kind,key]=g.split(':');(kind==='s'?out.sections:out.brands)[key]={title:v.title,full:pick(false),shorts:pick(true)};
}
// safety: keep previous cache if result collapsed
const total=o=>Object.values({...o.sections,...o.brands}).reduce((n,s)=>n+s.full.length+s.shorts.length,0);
if(fs.existsSync(OUT)){const prev=JSON.parse(fs.readFileSync(OUT));
 if(total(out)<total(prev)*0.5){console.error('Result collapsed, keeping previous',total(out),total(prev));process.exit(2)}
 fs.copyFileSync(OUT,OUT.replace(/\.json$/,'.prev.json'))}
out.units=units;fs.writeFileSync(OUT+'.tmp',JSON.stringify(out));fs.renameSync(OUT+'.tmp',OUT);
fs.writeFileSync(cachePath,JSON.stringify(cache));state.rot=(state.rot+qs.length)%allQ.length;fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify(state));
console.log('ok units',units,'videos',total(out));
for(const[k,s]of Object.entries({...out.sections,...Object.fromEntries(Object.entries(out.brands).map(([k,v])=>['brand/'+k,v]))}))console.log(k,s.full.length,s.shorts.length);
