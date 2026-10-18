'use strict';
const $=i=>document.getElementById(i),fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
let sd=7;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const R=Array.from({length:400},rnd),R2=Array.from({length:400},rnd);
const BG=[['Cyberpunk City','city','#12002b','#00e5ff'],['Neon Night','city','#050014','#ff2bd6'],['Galaxy','blobs','#050018','#7c3aed'],['Deep Space','grad','#000008','#4338ca'],['Mountains','mount','#0f172a','#38bdf8'],['Ocean','waves','#001b3a','#06b6d4'],['Sunset','sun','#3b0764','#fb923c'],['Abstract Geometry','grid','#0b0b14','#8b5cf6'],['Particles','blobs','#02040f','#22d3ee'],['Liquid Gradient','blobs','#1a0033','#f0abfc'],['Black and Gold Luxury','grad','#050505','#d4af37'],['Anime Abstract','blobs','#1e1b4b','#f472b6'],['Racing','tunnel','#0a0a0a','#ef4444'],['Minimal','grad','#111114','#52525b'],['Rainy Window','rain','#0b1220','#60a5fa'],['Aurora','waves','#020617','#34d399'],['Fire and Energy','blobs','#1a0500','#f97316'],['Dreamscape','mount','#2e1065','#f9a8d4'],['Digital Grid','grid','#000a0a','#22d3ee'],['Retro Wave','sun','#1a0033','#ff2bd6'],['Cosmic Tunnel','tunnel','#02000f','#8b5cf6']];
const FX=[['zoomin','Zoom in'],['zoomout','Zoom out'],['pan','Pan'],['shake','Shake'],['pulse','Beat pulse'],['particles','Particles'],['stars','Starfield'],['wave','Waveform'],['bars','Equalizer'],['ring','Spectrum ring'],['grid','Retro floor'],['geo','Rotating geometry'],['glitch','RGB glitch'],['sweep','Light sweep'],['glow','Neon glow'],['player','Music player card']];
const PRE={'Smooth Zoom In':['zoomin'],'Smooth Zoom Out':['zoomout'],'Ken Burns Pan':['pan','zoomin'],'Neon Glow':['glow','sweep'],'RGB Glitch':['glitch','shake'],'Particle Field':['particles'],'Starfield':['stars'],'Audio Waveform':['wave'],'Circular Music Visualizer':['ring'],'Equalizer Bars':['bars'],'Spectrum Ring':['ring','pulse','glow'],'Retro Wave':['grid','bars','glow'],'Rotating Geometry':['geo','glow'],'Liquid Gradient':['pan','pulse'],'Cinematic Shake':['shake','zoomin'],'Beat Pulse':['pulse'],'Light Sweep':['sweep'],'Parallax (simple)':['pan','particles','stars'],'Minimal Ambient':['pan'],'Music Player Card':['player','pulse','glitch','glow'],'Random Mix':null};
const SL={bg:[['bright','Brightness',.5,1.5,1],['contrast','Contrast',.5,1.5,1],['sat','Saturation',0,2,1],['blur','Blur',0,10,0],['zoom','Camera zoom',.5,2,1],['rot','Rotation',-45,45,0]],
fx:[['speed','Animation speed',.2,3,1],['motion','Motion intensity',0,2,1],['fxi','Effect intensity',0,2,1],['glow','Glow intensity',0,2,1],['dens','Particle density',0,2,1]],
au:[['vol','Volume',0,1,1],['ts','Start (s)',0,60,0],['te','End (s, 0 = full)',0,300,0]],tx:[['tsize','Size',2,25,8],['tx','X %',0,100,50],['ty','Y %',0,100,50]]};
const DEF=()=>({bg:0,c1:BG[0][3],c2:BG[0][2],fx:['pulse','particles'],preset:'Beat Pulse',text:'',ptitle:'ULTRA SLOWED',partist:'Artist',phandle:'@soni',font:'sans-serif',tcolor:'#ffffff',ar:'9:16',res:'1080',dur:'10',fps:'30',q:'0.1',aon:true,...Object.fromEntries(Object.values(SL).flat().map(s=>[s[0],s[4]]))});
let S=DEF(),IMG=null,buf=null,ac,gain,an,dst,fd=new Uint8Array(64),src=null,P={on:false,t0:0,off:0},raf=0,busy=false,cancel=false,url=null;
let wl=null,lastFile=null;const dur=()=>+S.dur;
function build(){const bg=$('bg');BG.forEach((b,i)=>bg.add(new Option(b[0],i)));
 const pr=$('preset');Object.keys(PRE).forEach(k=>pr.add(new Option(k,k)));
 FX.forEach(([k,n])=>{$('fx').insertAdjacentHTML('beforeend',`<label><input type="checkbox" data-fx="${k}">${n}</label>`)});
 for(const g in SL)$('sliders-'+g).innerHTML=SL[g].map(([k,n,a,b,d])=>`<label>${n}<input type="range" id="${k}" min="${a}" max="${b}" step="${(b-a)/100}" value="${d}"></label>`).join('')}
function sync(){$('bg').value=S.bg;['c1','c2','text','ptitle','partist','phandle','font','tcolor','ar','res','dur','fps','q','preset'].forEach(k=>$(k).value=S[k]);$('aon').checked=S.aon;
 document.querySelectorAll('[data-fx]').forEach(e=>e.checked=S.fx.includes(e.dataset.fx));Object.values(SL).flat().forEach(s=>$(s[0]).value=S[s[0]]);warn()}
function bind(){const num=new Set(Object.values(SL).flat().map(s=>s[0]));
 ['c1','c2','text','ptitle','partist','phandle','font','tcolor','ar','res','dur','fps','q'].concat([...num]).forEach(k=>$(k).addEventListener('input',e=>{S[k]=num.has(k)?+e.target.value:e.target.value;if(['ar','res','dur','fps'].includes(k))warn();if(k==='dur'&&P.off>dur())P.off=0;if(k==='vol'&&gain)gain.gain.value=$('mute').checked?0:S.vol;frame()}));
 $('aon').onchange=e=>S.aon=e.target.checked;
 $('bg').onchange=e=>{S.bg=+e.target.value;S.c1=BG[S.bg][3];S.c2=BG[S.bg][2];$('c1').value=S.c1;$('c2').value=S.c2;IMG=null;frame()};
 $('preset').onchange=e=>{S.preset=e.target.value;S.fx=PRE[S.preset]||FX.map(f=>f[0]).filter(()=>Math.random()<.35);sync();frame()};
 document.querySelectorAll('[data-fx]').forEach(e=>e.onchange=()=>{S.fx=[...document.querySelectorAll('[data-fx]')].filter(x=>x.checked).map(x=>x.dataset.fx);frame()});
 $('bgfile').onchange=e=>{const f=e.target.files[0];if(!f)return;const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{IMG=i;URL.revokeObjectURL(u);frame()};i.onerror=()=>{URL.revokeObjectURL(u);msg('That image could not be read.')};i.src=u};
 $('bgclear').onclick=()=>{IMG=null;frame()};
 $('afile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{initAC();stopA();buf=await ac.decodeAudioData(await f.arrayBuffer());$('ainfo').textContent=`${f.name} · ${fmt(buf.duration)}`;$('te').max=$('ts').max=Math.ceil(buf.duration)}catch(x){buf=null;$('ainfo').textContent='This browser cannot decode that audio file.'}};
 $('demo').onclick=()=>{initAC();const sr=ac.sampleRate,n=sr*16,b=ac.createBuffer(1,n,sr),d=b.getChannelData(0);for(let i=0;i<n;i++){const t=i/sr,bt=t%.5,k=Math.sin(2*Math.PI*(120*Math.exp(-bt*14)+40)*bt)*Math.exp(-bt*7),h=((t+.25)%.5<.03?(Math.random()-.5)*.3:0),bs=Math.sin(2*Math.PI*[55,65,49,73][Math.floor(t/2)%4]*t)*.25;d[i]=(k*.8+h+bs)*.8}buf=b;$('ainfo').textContent='Generated demo beat · 0:16'};
 $('mute').onchange=()=>{if(gain)gain.gain.value=$('mute').checked?0:S.vol};
 $('play').onclick=()=>P.on?pause():play();$('restart').onclick=()=>{const w=P.on;pause();P.off=0;frame();if(w)play()};
 $('seek').oninput=e=>{const w=P.on;pause();P.off=e.target.value/1000*dur();frame();if(w)play()};
 $('exp').onclick=exportVideo;$('share').onclick=()=>navigator.share({files:[lastFile],title:'SONI Motion'}).catch(()=>{});$('cancel').onclick=()=>cancel=true;
 $('save').onclick=()=>{const n=prompt('Project name?','Project '+(list().length+1));if(!n)return;const l=list().filter(p=>p.name!==n);l.push({name:n,s:S});try{localStorage.setItem('soni',JSON.stringify(l));plist()}catch(x){msg('Could not save: storage is full or blocked.')}};
 $('load').onclick=()=>{const p=list().find(p=>p.name===$('plist').value);if(p){S={...DEF(),...p.s};sync();frame()}};
 $('del').onclick=()=>{const n=$('plist').value;if(n&&confirm('Delete "'+n+'"?')){localStorage.setItem('soni',JSON.stringify(list().filter(p=>p.name!==n)));plist()}};
 $('jexp').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.href=u;a.download='soni-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)};
 $('jimp').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),d=DEF(),o={};for(const k in d){if(!(k in j))continue;if(typeof j[k]!==typeof d[k])throw 0;o[k]=j[k]}if(o.bg>=BG.length||o.bg<0||!(o.fx||[]).every(f=>FX.some(x=>x[0]===f)))throw 0;S={...d,...o};sync();frame()}catch(x){msg('That file is not a valid SONI project.')}};
 $('reset').onclick=()=>{if(confirm('Reset all settings?')){S=DEF();IMG=null;sync();frame()}};
 let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(frame,150)});addEventListener('visibilitychange',()=>{if(document.hidden&&P.on)pause()});addEventListener('orientationchange',()=>setTimeout(frame,200))}
const list=()=>{try{return JSON.parse(localStorage.getItem('soni')||'[]')}catch(x){return[]}};
function plist(){$('plist').innerHTML='';list().forEach(p=>$('plist').add(new Option(p.name,p.name)))}
function msg(t){$('status').textContent=t}
function initAC(){if(ac)return;ac=new (window.AudioContext||window.webkitAudioContext)();gain=ac.createGain();an=ac.createAnalyser();an.fftSize=256;dst=ac.createMediaStreamDestination();gain.connect(an);an.connect(ac.destination);gain.connect(dst);gain.gain.value=S.vol}
function startA(off,forExport){if(!buf||src)return;initAC();ac.resume();const s0=+S.ts,e=+S.te>s0?+S.te:buf.duration,len=Math.min(e-s0,dur())-off;if(len<=0)return;
 gain.gain.value=forExport?S.vol:($('mute').checked?0:S.vol);src=ac.createBufferSource();src.buffer=buf;src.connect(gain);src.start(0,s0+off,len);src.onended=()=>{src=null}}
function stopA(){if(src){try{src.onended=null;src.stop()}catch(x){}src.disconnect();src=null}}
function dims(){const[a,b]=S.ar.split(':').map(Number),s=+S.res,e=n=>Math.round(n/2)*2;return a>=b?[e(s*a/b),s]:[s,e(s*b/a)]}
function size(){const[w,h]=dims(),k=Math.min(1,480/Math.max(w,h)),pw=Math.round(w*k),ph=Math.round(h*k);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph}cv.style.aspectRatio=w+'/'+h}
function level(t){if(an&&src)an.getByteFrequencyData(fd);else for(let i=0;i<64;i++)fd[i]=Math.max(0,90+70*Math.sin(i*.4+t*3))*(.5+.5*Math.pow(1-(t*2%1),3));let b=0,l=0;for(let i=0;i<64;i++){l+=fd[i];if(i<8)b+=fd[i]}return{f:fd,bass:b/8/255,lv:l/64/255}}
function bgDraw(x,w,h,t,k){const m=Math.min(w,h);x.fillStyle=S.c2;x.fillRect(-w,-h,3*w,3*h);
 if(IMG){const s=Math.max(w/IMG.width,h/IMG.height);x.drawImage(IMG,(w-IMG.width*s)/2,(h-IMG.height*s)/2,IMG.width*s,IMG.height*s);return}
 const gr=x.createRadialGradient(w/2,h*.7,0,w/2,h*.7,h*.8);gr.addColorStop(0,S.c1+'88');gr.addColorStop(1,S.c1+'00');x.fillStyle=gr;x.fillRect(-w,-h,3*w,3*h);
 if(k=='blobs')for(let i=0;i<6;i++){const cx=w*(.5+.4*Math.sin(t*.3+i*2)),cy=h*(.5+.4*Math.cos(t*.25+i*3)),r=m*(.3+R[i]*.3),q=x.createRadialGradient(cx,cy,0,cx,cy,r);q.addColorStop(0,S.c1+'aa');q.addColorStop(1,S.c1+'00');x.fillStyle=q;x.fillRect(cx-r,cy-r,2*r,2*r)}
 if(k=='city')for(let i=0;i<26;i++){const bw=w/14,bh=h*(.12+R[i]*.38),bx=i*w/22-bw*.3;x.fillStyle='#000000cc';x.fillRect(bx,h-bh,bw,bh);x.fillStyle=S.c1+'bb';for(let j=0;j<8;j++)if(R2[i*8+j]>.6)x.fillRect(bx+bw*.15+(j%3)*bw*.28,h-bh+bh*.08*(1+Math.floor(j/3)*2),bw*.14,bh*.04)}
 if(k=='mount')for(let l=0;l<3;l++){x.beginPath();x.moveTo(-w,h);for(let i=-w;i<=2*w;i+=w/40)x.lineTo(i,h*(.55+.12*l)+Math.sin(i*.008*(l+1)+l*2)*h*.06+Math.sin(i*.03+l)*h*.015);x.lineTo(2*w,h);x.fillStyle=l?'rgba(0,0,0,'+(.3+l*.25)+')':S.c1+'44';x.fill()}
 if(k=='waves')for(let l=0;l<6;l++){x.beginPath();x.moveTo(0,h);for(let i=0;i<=w;i+=w/40)x.lineTo(i,h*(.35+.1*l)+Math.sin(i/w*6+t*.8+l)*h*.03);x.lineTo(w,h);x.fillStyle=S.c1+'26';x.fill()}
 if(k=='sun'){const cy=h*.45,r=m*.28,q=x.createLinearGradient(0,cy-r,0,cy+r);q.addColorStop(0,'#fde047');q.addColorStop(1,S.c1);x.fillStyle=q;x.beginPath();x.arc(w/2,cy,r,0,7);x.fill();x.fillStyle=S.c2;for(let i=0;i<6;i++)x.fillRect(w/2-r,cy+r*(.1+i*.15),2*r,r*.03*(i+1));x.fillRect(0,h*.6,w,h*.4)}
 if(k=='grid')gridFloor(x,w,h,t);
 if(k=='tunnel'){x.lineWidth=m*.004;for(let i=0;i<16;i++){const p=((i+t*.7)%16)/16,r=p*p*m*1.1;x.strokeStyle=S.c1+Math.floor(p*200+30).toString(16).padStart(2,'0');x.strokeRect(w/2-r,h/2-r,2*r,2*r)}}
 if(k=='rain'){x.strokeStyle='#ffffff55';x.lineWidth=Math.max(1,m*.002);for(let i=0;i<140;i++){const px=R[i]*w,py=(R2[i]*h+t*h*.5*(.5+R[i]))%h;x.beginPath();x.moveTo(px,py);x.lineTo(px-3,py+m*.04);x.stroke()}}}
function gridFloor(x,w,h,t){const hz=h*.58;x.strokeStyle=S.c1;x.lineWidth=Math.max(1,w*.002);x.globalAlpha=.7;for(let i=-10;i<=10;i++){x.beginPath();x.moveTo(w/2+i*w*.04,hz);x.lineTo(w/2+i*w*.4,h);x.stroke()}for(let j=0;j<10;j++){const p=((j+t*.5)%10)/10,y=hz+(h-hz)*p*p;x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}x.globalAlpha=1}
function draw(c,t,au){const x=c.getContext('2d'),w=c.width,h=c.height,m=Math.min(w,h),f=new Set(S.fx),e=S.fxi,sp=t*S.speed,B=au.bass,D=dur(),has=k=>f.has(k);
 x.save();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,w,h);
 let z=S.zoom*(has('zoomin')?1+.2*t/D*S.motion:1)*(has('zoomout')?1+.2*(1-t/D)*S.motion:1)*(has('pulse')?1+.05*B*e:1),sx=0,sy=0;
 if(has('pan')){sx=Math.sin(sp*.4)*w*.04*S.motion;sy=Math.cos(sp*.3)*h*.03*S.motion}
 if(has('shake')){sx+=(Math.random()-.5)*w*.012*S.motion*(1+B*3);sy+=(Math.random()-.5)*h*.012*S.motion*(1+B*3)}
 x.translate(w/2+sx,h/2+sy);x.rotate(S.rot*Math.PI/180);x.scale(z,z);x.translate(-w/2,-h/2);
 x.filter=(S.bright==1&&S.contrast==1&&S.sat==1&&!S.blur)?'none':`brightness(${S.bright}) contrast(${S.contrast}) saturate(${S.sat}) blur(${S.blur*m/640}px)`;bgDraw(x,w,h,sp,BG[S.bg][1]);x.filter='none';x.restore();
 x.save();const gl=has('glow')?S.glow:0;x.shadowColor=S.c1;x.shadowBlur=gl*m*.03;x.fillStyle=S.c1;x.strokeStyle=S.c1;x.lineWidth=Math.max(2,m*.006);x.lineCap='round';
 if(has('grid')&&BG[S.bg][1]!='grid')gridFloor(x,w,h,sp);
 if(has('particles')){const n=Math.floor(160*S.dens);for(let i=0;i<n;i++){const px=(R[i]*w+Math.sin(sp*.5+i)*m*.03+w)%w,py=((R2[i]-sp*.04*(.3+R[i]))%1+1)%1*h;x.globalAlpha=.3+.5*R2[(i+9)%400];x.beginPath();x.arc(px,py,m*.004*(1+R[i]*2)*(1+B*e),0,7);x.fill()}x.globalAlpha=1}
 if(has('stars')){x.fillStyle='#fff';for(let i=0;i<120;i++){const p=((R[i]+sp*.15*e)%1),r=p*p,px=w/2+(R2[i]-.5)*w*2.2*r,py=h/2+(R[(i+50)%400]-.5)*h*2.2*r;x.globalAlpha=r;x.fillRect(px,py,1+m*.006*r,1+m*.006*r)}x.globalAlpha=1;x.fillStyle=S.c1}
 if(has('geo')){x.translate(w/2,h/2);for(let k=0;k<4;k++){x.save();x.rotate(sp*.4*(k%2?-1:1)+k);const r=m*(.15+.07*k)*(1+B*e*.3),n=3+k;x.beginPath();for(let i=0;i<=n;i++)x.lineTo(Math.cos(i/n*6.2832)*r,Math.sin(i/n*6.2832)*r);x.stroke();x.restore()}x.translate(-w/2,-h/2)}
 if(has('bars')){const n=32,bw=w/n;for(let i=0;i<n;i++){const v=au.f[i]/255*e,bh=Math.max(3,v*h*.35);x.globalAlpha=.85;x.fillRect(i*bw+bw*.15,h-bh-h*.04,bw*.7,bh)}x.globalAlpha=1}
 if(has('wave')){x.beginPath();for(let i=0;i<64;i++){const px=i/63*w,py=h*.5+Math.sin(i*.5+sp*3)*au.f[i]/255*h*.15*e;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke()}
 if(has('ring')){x.translate(w/2,h/2);const r0=m*.2*(1+B*.15*e);for(let i=0;i<64;i++){const a=i/64*6.2832+sp*.2,l=au.f[i]/255*m*.18*e+m*.01;x.beginPath();x.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);x.lineTo(Math.cos(a)*(r0+l),Math.sin(a)*(r0+l));x.stroke()}x.translate(-w/2,-h/2)}
 if(has('sweep')){const p=(sp*.25%1)*3-1,q=x.createLinearGradient((p-.2)*w,0,(p+.2)*w,h*.4);q.addColorStop(0,'#ffffff00');q.addColorStop(.5,'#ffffff40');q.addColorStop(1,'#ffffff00');x.shadowBlur=0;x.fillStyle=q;x.fillRect(0,0,w,h)}
 x.restore();
 if(has('glitch')&&(B>.45||Math.sin(t*9)>.9)){const k=e*(.5+B);for(let i=0;i<5;i++){const y=Math.random()*h,hh=h*.04*Math.random()+2,o=(Math.random()-.5)*w*.08*k;x.drawImage(c,0,y,w,hh,o,y,w,hh)}x.save();x.globalCompositeOperation='screen';x.globalAlpha=.35;x.drawImage(c,m*.006*k,0);x.restore()}
 if(has('player'))player(x,w,h,t,au,m,B);
 if(S.text){x.save();x.fillStyle=S.tcolor;x.font=`700 ${S.tsize/100*m}px ${S.font}`;x.textAlign='center';x.textBaseline='middle';x.shadowColor='#000000aa';x.shadowBlur=m*.01;x.fillText(S.text,S.tx/100*w,S.ty/100*h,w*.95);x.restore()}}
function rr(x,a,b,w,h,r){x.beginPath();x.roundRect?x.roundRect(a,b,w,h,r):x.rect(a,b,w,h)}
function player(x,w,h,t,au,m,B){const e=S.fxi,cw=Math.min(w*.88,h*1.1),ch=cw*.5,D=dur();x.save();x.translate(w/2,h*.48);x.rotate(-.025);{const k=1+.03*B*e;x.scale(k,k)}
 x.shadowColor=S.c1;x.shadowBlur=m*.05*(.4+B*e)*Math.max(.3,S.glow);x.fillStyle='rgba(10,10,12,.8)';x.strokeStyle=S.c1;x.lineWidth=Math.max(2,cw*.004);rr(x,-cw/2,-ch/2,cw,ch,cw*.04);x.fill();x.stroke();x.shadowBlur=0;
 const sz=ch*.74,x0=-cw/2+cw*.04,y0=-ch/2+ch*.13;x.save();rr(x,x0,y0,sz,sz,cw*.02);x.clip();
 if(IMG){const s=Math.max(sz/IMG.width,sz/IMG.height);x.drawImage(IMG,x0+(sz-IMG.width*s)/2,y0+(sz-IMG.height*s)/2,IMG.width*s,IMG.height*s)}else{const g=x.createLinearGradient(x0,y0,x0+sz,y0+sz);g.addColorStop(0,S.c1);g.addColorStop(1,S.c2);x.fillStyle=g;x.fillRect(x0,y0,sz,sz);x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.arc(x0+sz/2,y0+sz/2,sz*(.22+.08*B*e),0,7);x.fill()}x.restore();
 const tx=x0+sz+cw*.05,rt=cw/2-cw*.04,bw=rt-tx;x.textBaseline='middle';x.textAlign='left';x.fillStyle='#fff';x.font=`700 ${cw*.05}px ${S.font}`;x.fillText(S.ptitle,tx,y0+sz*.1,bw);x.font=`${cw*.04}px ${S.font}`;x.fillText('Artist : '+S.partist,tx,y0+sz*.24,bw);
 const N=36,by=y0+sz*.5,bh=sz*.26,p=t/D;for(let i=0;i<N;i++){const v=.2+.8*R2[i]*(.45+.55*au.f[i%64]/255*e),hh=bh*v,played=i/N<p;x.fillStyle=played?S.c1:'rgba(255,255,255,.4)';x.fillRect(tx+i*bw/N,by-hh/2,bw/N*.55,hh)}
 const cy=y0+sz*.8,u=cw*.025;x.fillStyle='#fff';x.font=`${cw*.05}px sans-serif`;x.fillText('\u2665',tx,cy);
 const mx=tx+bw*.5;x.fillRect(mx-u*.9,cy-u,u*.7,u*2);x.fillRect(mx+u*.2,cy-u,u*.7,u*2);
 for(const d of[-1,1]){const px=mx+d*bw*.25;x.beginPath();x.moveTo(px-d*u,cy-u);x.lineTo(px+d*u,cy);x.lineTo(px-d*u,cy+u);x.fill();x.fillRect(px+d*u*(d>0?1:-1)*.9-(d>0?0:u*.4),cy-u,u*.4,u*2)}
 x.font=`${cw*.032}px ${S.font}`;const ry=ch*.435;x.fillText(fmt(t),tx,ry);x.textAlign='center';x.fillText(S.fps+' Fps',tx+bw/2,ry);x.textAlign='right';x.fillText(S.phandle,rt,ry);x.restore()}
const cv=$('cv');
function frame(){size();const t=cur();draw(cv,t,level(t));ui()}
const cur=()=>P.on?Math.min(dur(),P.off+(performance.now()-P.t0)/1000):P.off;
function ui(){const t=cur();$('time').textContent=`${fmt(t)} / ${fmt(dur())}`;$('seek').value=t/dur()*1000;$('play').textContent=P.on?'Pause':'Play'}
let lt=0;function tick(){if(!P.on)return;const n=performance.now();if(n-lt<30){raf=requestAnimationFrame(tick);return}lt=n;const t=cur();draw(cv,t,level(t));ui();if(t>=dur()){pause();P.off=0;return}raf=requestAnimationFrame(tick)}
function play(){if(busy)return;if(P.off>=dur())P.off=0;stopA();P.on=true;P.t0=performance.now();startA(P.off,false);tick()}
function pause(){if(P.on)P.off=cur();P.on=false;cancelAnimationFrame(raf);stopA();ui()}
function warn(){const[w,h]=dims(),px=w*h*dur()*+S.fps/1e9;$('warn').textContent=`Output: ${w}×${h}. `+(+S.res>=2160?'4K recording is heavy and may fail or drop frames on phones; 1080p is the safe fallback. ':'')+(px>6?'Long high-resolution exports take as long as the video itself and use a lot of memory.':'')}
async function exportVideo(){
 if(busy)return;
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return msg('This browser cannot record video from a canvas. Use recent Chrome or Edge on Android.');
 const mt=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mt)return msg('No supported video format was found in this browser.');
 pause();busy=true;cancel=false;try{wl=await navigator.wakeLock.request('screen')}catch(x){}if(url){URL.revokeObjectURL(url);url=null}$('dl').hidden=true;$('share').hidden=true;
 const[W,H]=dims(),fps=+S.fps,D=dur(),c=document.createElement('canvas');c.width=W;c.height=H;
 const audio=S.aon&&buf;let rec,stream,chunks=[],failed=false;
 $('exp').disabled=true;$('cancel').hidden=false;$('prog').hidden=false;$('prog').value=0;msg('Preparing export… keep this tab open and the screen on.');
 const done=()=>{try{wl&&wl.release()}catch(x){}wl=null;stopA();stream&&stream.getTracks().forEach(t=>t.stop());busy=false;$('exp').disabled=false;$('cancel').hidden=true;$('prog').hidden=true;P.off=0;frame()};
 try{stream=c.captureStream(fps);if(audio){initAC();await ac.resume();stream.addTrack(dst.stream.getAudioTracks()[0])}
  rec=new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:Math.min(80e6,Math.round(W*H*fps*+S.q))});
  rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  rec.onerror=e=>{failed=true;cancel=true;msg('Recording failed: '+(e.error&&e.error.message||'unknown error')+'. Try a lower resolution.')};
  rec.onstop=()=>{if(!cancel&&chunks.length){const ext=mt.includes('mp4')?'mp4':'webm',b=new Blob(chunks,{type:mt.split(';')[0]});url=URL.createObjectURL(b);const a=$('dl');a.href=url;a.download=`soni-motion-${W}x${H}-${Date.now()}.${ext}`;a.hidden=false;lastFile=new File([b],a.download,{type:b.type});$('share').hidden=!(navigator.canShare&&navigator.canShare({files:[lastFile]}));a.textContent=`Download ${a.download} (${(b.size/1048576).toFixed(1)} MB, ${ext.toUpperCase()}, ${W}×${H})`;msg(`Export finished. Format: ${mt}.`+(audio?'':' No audio included.'))}else if(!failed)msg('Export cancelled.');chunks=[];done()};
  if(audio)startA(0,true);rec.start(1000);const t0=performance.now();
  (function step(){if(cancel){rec.state!=='inactive'&&rec.stop();return}const t=(performance.now()-t0)/1000;try{draw(c,Math.min(t,D),level(t))}catch(x){failed=true;cancel=true;msg('Recording failed: '+x.message);rec.stop();return}
   $('prog').value=Math.min(1,t/D);msg(`Rendering ${fmt(t)} / ${fmt(D)}`);if(t>=D)rec.stop();else requestAnimationFrame(step)})();
 }catch(x){msg('Export failed: '+x.message+'. Try a lower resolution or frame rate.');done()}}
build();bind();plist();sync();frame();
if(/; wv\)|Instagram|FBAN|TikTok|Telegram/i.test(navigator.userAgent))msg('Downloads can be blocked inside in-app browsers. Open this site in Chrome.');
