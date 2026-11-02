// Fetch live oldseadogs.com header/footer/CSS so Harbour TV matches exactly. Falls back to cached shell.json.
import fs from 'fs';import path from 'path';
const dir=path.dirname(new URL(import.meta.url).pathname),SITE='https://oldseadogs.com';
export async function liveShell(){const cache=path.join(dir,'shell.json');
 try{const h=await (await fetch(SITE+'/',{headers:{'user-agent':'HarbourTV-build'}})).text();
  const grab=(re,tag)=>{const m=h.match(re);if(!m)throw new Error('no '+tag);const s=m.index;let d=0;const r=new RegExp(`<(/?)${tag}\\b[^>]*>`,'g');r.lastIndex=s;let x;while((x=r.exec(h))){d+=x[1]?-1:1;if(d===0)return h.slice(s,r.lastIndex)}};
  const abs=s=>s.replace(/(href|src|srcSet)="\/(?!\/)/g,`$1="${SITE}/`).replace(/ aria-current="page"/g,'');
  const css=[...h.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1].startsWith('/')?SITE+m[1]:m[1]);
  const o={css:[...new Set(css)],mobile:abs(grab(/<header class="mobile-site-header/,'header')),mast:abs(grab(/<header class="site-mast"/,'header')),footer:abs(grab(/<footer class="site-footer"/,'footer'))};
  fs.writeFileSync(cache,JSON.stringify(o));return o}
 catch(e){console.warn('live shell fetch failed, using cache:',e.message);return JSON.parse(fs.readFileSync(cache))}}
