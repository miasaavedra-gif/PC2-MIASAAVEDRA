const points = {ga:[155,102], hu:[286,180], it:[154,253], a:[472,102], b:[472,253], c:[563,179]};
const ns = 'http://www.w3.org/2000/svg';
function draw(parent, tag, attributes, text) {
  const item = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, value);
  if (text) item.textContent = text;
  parent.append(item);
  return item;
}
export function drawTerritory(svg, scenario) {
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 720 325');
  draw(svg, 'title', {}, 'Esquema de reubicación entre la calle y la galería seleccionadas');
  draw(svg, 'rect', {width:720,height:325,fill:'#f1f0e8'});
  const blocks=draw(svg,'g',{transform:'rotate(-13 360 162)'});
  const fills=['#dfdfd3','#e1e2d8','#e4e3da','#daddcf'];
  for (let row=-2;row<9;row++) {
    for(let col=-2;col<11;col++) {
      const x=col*86+(row%2)*8,y=row*49;
      const park=(col===3 && row===1)||(col===6 && row===5);
      draw(blocks,'rect',{x,y,width:72,height:36,rx:3,fill:park?'#c7d9c0':fills[Math.abs(row+col)%4],stroke:'#c9cbbf','stroke-width':.8});
      if(park) continue;
      for(const offset of [16,35,53])draw(blocks,'path',{d:'M'+(x+offset)+' '+(y+1)+'v34',stroke:'#f0efe5','stroke-width':2});
      draw(blocks,'path',{d:'M'+(x+1)+' '+(y+18)+'h69',stroke:'#f2f1e8','stroke-width':2});
    }
  }
  const [ox,oy]=points[scenario.p.origin], [dx,dy]=points[scenario.p.destination];
  const mid=ox+(dx-ox)*.56;
  const route='M'+ox+' '+oy+' L'+mid+' '+(oy-17)+' L'+(mid+25)+' '+(dy+14)+' L'+dx+' '+dy;
  draw(svg,'path',{d:route,fill:'none',stroke:'#fff','stroke-width':8,'stroke-linejoin':'round'});
  draw(svg,'path',{d:route,fill:'none',stroke:'#095d76','stroke-width':3.5,'stroke-dasharray':'7 5','stroke-linejoin':'round'});
  const ordered=[...scenario.zones].sort((a,b)=>Number([scenario.p.origin,scenario.p.destination].includes(a.id))-Number([scenario.p.origin,scenario.p.destination].includes(b.id)));
  for(const zone of ordered) {
    const [x,y]=points[zone.id], origin=zone.id===scenario.p.origin, dest=zone.id===scenario.p.destination, active=origin||dest;
    const ink=origin?'#af4a2e':dest?'#005d78':'#61746e';
    if(active)draw(svg,'circle',{cx:x,cy:y,r:17,fill:ink,opacity:.14});
    if(zone.kind==='Galería')draw(svg,'rect',{x:x-6,y:y-6,width:12,height:12,rx:2,transform:'rotate(45 '+x+' '+y+')',fill:ink,stroke:'#fff','stroke-width':2});
    else draw(svg,'circle',{cx:x,cy:y,r:active?7:5,fill:ink,stroke:'#fff','stroke-width':2});
    const label=zone.name.length>19?zone.name.slice(0,18)+'…':zone.name;
    const w=label.length*7.7+18;
    draw(svg,'rect',{x:x-w/2,y:y+14,width:w,height:23,rx:4,fill:active?ink:'#fafaf3',stroke:active?ink:'#d2d8cc'});
    draw(svg,'text',{x,y:y+30,'text-anchor':'middle',fill:active?'white':'#425953','font-size':13,'font-weight':active?700:550},label);
  }
}
