import {atlas} from './atlas-data.mjs';

export const locations = {
 ga:{name:'Jr. Agustín Gamarra',street:'Jirón Mariscal Agustín Gamarra'},
 hu:{name:'Jr. Huánuco',street:'Jirón Huánuco'},
 it:{name:'Jr. Italia',street:'Jirón Italia'},
 a:{name:'Damero Gamarra Plaza',address:'Jr. Agustín Gamarra 939',lon:-77.0130493,lat:-12.0675946},
 b:{name:'Parque Cánepa',address:'Jr. Huánuco 1601',lon:-77.0149844,lat:-12.0647875},
 c:{name:'C.C. Carrión',address:'Jr. Hipólito Unanue 1583',lon:-77.0137947,lat:-12.0651471}
};
const $=id=>document.getElementById(id);
const roads=atlas.ways.filter(w=>w[0]==='road');
const streets=[...new Set(roads.map(w=>w[1]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
const short=n=>n.replace('Jirón Mariscal Agustín Gamarra','Jr. Agustín Gamarra').replace(/^Jirón /,'Jr. ').replace(/^Avenida /,'Av. ');
const anchors=Object.entries(locations).filter(([,v])=>v.address).map(([id,v])=>({id,...v,x:(v.lon-atlas.center[0])*108850,y:(atlas.center[1]-v.lat)*110625}));
const mainNames=['Jirón Mariscal Agustín Gamarra','Jirón Huánuco','Jirón Italia','Jirón Antonio Bazo','Jirón Humboldt','Jirón Hipólito Unánue','Avenida Jaime Bausate y Meza','Avenida Isabel La Católica','Jirón Sebastián Barranca','Avenida Aviación'];
let scenario,canvas,ctx,observer,frame,cx=0,cy=65,zoom=1,selected='',pointer=null,width,height,scale;
function redraw(){cancelAnimationFrame(frame);frame=requestAnimationFrame(paint)}
function xy(p){return [(p[0]-cx)*scale+width/2,(p[1]-cy)*scale+height/2]}
function path(pts){ctx.beginPath();pts.forEach((p,i)=>{const [x,y]=xy(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)})}
function renderWays(){
 ctx.lineJoin='round';ctx.lineCap='round';
 for(const [kind,,,pts] of atlas.ways){if(kind==='road')continue;path(pts);ctx.closePath();ctx.fillStyle=kind==='park'?'#bcd3b1':'#e1d9c9';ctx.fill();ctx.lineWidth=.55;ctx.strokeStyle=kind==='park'?'#95b18c':'#c8c0b1';ctx.stroke()}
 const origin=locations[scenario.p.origin]?.street;
 for(const [color,widthM] of [['#cfc8b9',10],['#fffdf6',8]]){
  ctx.strokeStyle=color;
  for(const [,n,,pts] of roads){ctx.lineWidth=Math.max(1,(n?widthM:widthM*.36)*scale);path(pts);ctx.stroke()}
 }
 for(const [,n,,pts] of roads){if(n!==origin&&(!selected||n!==selected))continue;ctx.strokeStyle=n===selected?'#246e7b':'#bf5938';ctx.lineWidth=Math.max(3,5*scale);path(pts);ctx.stroke()}
}
function paint(){
 if(!canvas||!canvas.clientWidth)return;
 width=canvas.clientWidth;height=canvas.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr)}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#f1ede1';ctx.fillRect(0,0,width,height);scale=Math.min(width/690,height/660)*zoom;renderWays();
 const occupied=[];function reserve(x,y,w,h){const b=[x-w/2,y-h/2,x+w/2,y+h/2];if(occupied.some(a=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]))return false;occupied.push(b);return true}
 function text(s,x,y,angle,color,bg,bold){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font=(bold?'bold ':'')+'12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle=bg;ctx.lineWidth=3.8;ctx.strokeText(s,0,0);ctx.fillStyle=color;ctx.fillText(s,0,0);ctx.restore()}
 const pins=[...anchors].sort((a,b)=>Number(b.id===scenario.p.destination)-Number(a.id===scenario.p.destination));
 for(const p of pins){const [x,y]=xy([p.x,p.y]),active=p.id===scenario.p.destination;ctx.fillStyle=active?'#125b55':'#fffaf0';ctx.strokeStyle='#1c6158';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,active?8:5,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(x<8||x>width-8||y<8||y>height-8)continue;ctx.font='bold 12px Arial';const w=ctx.measureText(p.name).width+14,lx=Math.max(w/2+4,Math.min(width-w/2-4,x)),ly=y-20;
 if(reserve(lx,ly,w+3,22)){ctx.fillStyle=active?'#155d55':'#fffaf1';ctx.fillRect(lx-w/2,ly-10,w,20);text(p.name,lx,ly,0,active?'white':'#24584c',ctx.fillStyle,true)}}
 const list=[...new Set([selected,locations[scenario.p.origin]?.street,...mainNames,...streets].filter(Boolean))];
 for(const n of list){const s=short(n),length=s.length*6.1,candidates=[];
  for(const [,name,,pts] of roads){if(n!==name)continue;for(let i=1;i<pts.length;i++){const [ax,ay]=xy(pts[i-1]),[bx,by]=xy(pts[i]),x=(ax+bx)/2,y=(ay+by)/2;let ang=Math.atan2(by-ay,bx-ax);if(ang>Math.PI/2)ang-=Math.PI;if(ang< -Math.PI/2)ang+=Math.PI;const w=Math.abs(Math.cos(ang))*length+18,h=Math.abs(Math.sin(ang))*length+12;if(x<w/2||x>width-w/2||y<h/2||y>height-h/2)continue;candidates.push({x,y,ang,w,h,score:Math.hypot(bx-ax,by-ay)-Math.hypot(x-width/2,y-height/2)*.17})}}
  candidates.sort((a,b)=>b.score-a.score);for(const p of candidates){if(reserve(p.x,p.y,p.w,p.h)){text(s,p.x,p.y,p.ang,n===locations[scenario.p.origin]?.street?'#803821':'#444c45','#fffcf1',false);break}}
 }
 const meters=scale>1.1?50:100,bx=16,by=height-18;ctx.fillStyle='#fffaf0';ctx.fillRect(bx-4,by-15,meters*scale+9,24);ctx.fillStyle='#374b42';ctx.font='11px Arial';ctx.textAlign='left';ctx.fillText(meters+' m',bx,by-2);ctx.fillRect(bx,by+2,meters*scale,2);
}
function setZoom(f){zoom=Math.max(.78,Math.min(5,zoom*f));redraw()}
function center(x=0,y=65,z=1){cx=x;cy=y;zoom=z;redraw()}
function reset(){selected='';$('streetSearch').value='';center()}
function inspectStreet(n){selected=n;if(!n){reset();return}const pts=roads.filter(w=>w[1]===n).flatMap(w=>w[3]);const p=pts.reduce((best,p)=>Math.hypot(...p)<Math.hypot(...best)?p:best,pts[0]);center(p[0],p[1],1.5)}
function init(el){
 canvas=el;ctx=canvas.getContext('2d');observer=new ResizeObserver(redraw);observer.observe(canvas);
 const select=$('streetSearch');for(const n of streets){const opt=document.createElement('option');opt.textContent=n;opt.value=n;select.append(opt)}select.onchange=()=>inspectStreet(select.value);
 $('zoomIn').onclick=()=>setZoom(1.4);$('zoomOut').onclick=()=>setZoom(1/1.4);$('resetMap').onclick=reset;
 canvas.onpointerdown=e=>{pointer={id:e.pointerId,x:e.clientX,y:e.clientY,cx,cy};canvas.setPointerCapture(e.pointerId)};
 canvas.onpointermove=e=>{if(!pointer||pointer.id!==e.pointerId||!scale)return;cx=Math.max(-520,Math.min(520,pointer.cx-(e.clientX-pointer.x)/scale));cy=Math.max(-650,Math.min(650,pointer.cy-(e.clientY-pointer.y)/scale));redraw()};
 canvas.onpointerup=canvas.onpointercancel=()=>{pointer=null};
 canvas.onkeydown=e=>{const n=60/(scale||1);if(e.key==='ArrowLeft')cx-=n;else if(e.key==='ArrowRight')cx+=n;else if(e.key==='ArrowUp')cy-=n;else if(e.key==='ArrowDown')cy+=n;else if(e.key==='+')setZoom(1.4);else if(e.key==='-')setZoom(1/1.4);else return;e.preventDefault();cx=Math.max(-520,Math.min(520,cx));cy=Math.max(-650,Math.min(650,cy));redraw()};
}
export function drawTerritory(el,c){if(!canvas)init(el);scenario=c;const a=locations[c.p.origin],b=locations[c.p.destination];$('mapOrigin').textContent=a.name;$('mapDest').textContent=b.name+' · '+b.address;const link=$('directions');link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.lat+','+b.lon);redraw()}
