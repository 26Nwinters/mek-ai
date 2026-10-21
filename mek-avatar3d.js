/* MEK-AI REBIRTH / optional GPU avatar.
   Three.js is loaded as an ES module. The expressive inline SVG remains usable
   if the CDN, browser GPU, or WebGL context is unavailable. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

const wrap=document.querySelector('.eyewrap');
if(wrap){
 const prefs=()=>window.mekRebirthPrefs||{avatar:'auto',motion:true};
 const prefersLess=window.matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-3.75,3.75,4.65,-4.65,.1,100);
 camera.position.set(0,0,15);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 const canvas=renderer.domElement;
 canvas.className='mek-avatar-canvas';
 canvas.setAttribute('aria-hidden','true');
 canvas.setAttribute('role','presentation');
 wrap.append(canvas);
 const root=new THREE.Group();
 scene.add(root);
 const steel=new THREE.MeshStandardMaterial({color:0x323d40,metalness:.83,roughness:.3,flatShading:true});
 const darkSteel=new THREE.MeshStandardMaterial({color:0x131c22,metalness:.8,roughness:.36,flatShading:true});
 const obsidian=new THREE.MeshStandardMaterial({color:0x0a1118,metalness:.69,roughness:.4,flatShading:true});
 const copper=new THREE.MeshStandardMaterial({color:0x9e7450,metalness:.82,roughness:.32,flatShading:true});
 const bronze=new THREE.MeshStandardMaterial({color:0xb18e64,metalness:.75,roughness:.3,flatShading:true});
 const eyeMat=new THREE.MeshBasicMaterial({color:0xffba5d,transparent:true,opacity:1});
 const innerGlow=new THREE.MeshBasicMaterial({color:0xf19b45,transparent:true,opacity:.65});
 scene.add(new THREE.AmbientLight(0xb2bdc5,1.7));
 const key=new THREE.DirectionalLight(0xffc78c,3.2);key.position.set(-3,5,7);scene.add(key);
 const fill=new THREE.DirectionalLight(0x688fa1,1.4);fill.position.set(5,-1,4);scene.add(fill);
 const rim=new THREE.PointLight(0xe6a55a,20,14);rim.position.set(0,-2,5);scene.add(rim);
 function plate(points,material,depth=.17,z=0,parent=root){
  const shape=new THREE.Shape();
  points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.035,bevelThickness:.04,bevelSegments:1,curveSegments:2});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.z=z;
  parent.add(mesh);
  return mesh;
 }
 function bar(x,y,w,h,material,z=.4,parent=root,angle=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.07),material);
  m.position.set(x,y,z);m.rotation.z=angle;parent.add(m);return m;
 }
 // Structural skull and a split crown are modelled as separate extruded metal plates.
 plate([[-1.34,3.0],[0,3.62],[1.34,3.0],[2.07,1.95],[2.1,.58],[1.62,-1.96],[.67,-3.1],[0,-3.57],[-.67,-3.1],[-1.62,-1.96],[-2.1,.58],[-2.07,1.95]],obsidian,.36,-.8);
 plate([[-1.38,2.8],[0,3.4],[1.38,2.8],[1.92,1.9],[1.7,.23],[.82,-.3],[0,-.59],[-.82,-.3],[-1.7,.23],[-1.92,1.9]],steel,.18,-.4);
 plate([[-.63,3.24],[0,3.52],[.63,3.24],[.42,2.63],[0,2.33],[-.42,2.63]],copper,.22,.12);
 plate([[-.3,3.24],[0,3.36],[.3,3.24],[.14,2.94],[0,2.82],[-.14,2.94]],darkSteel,.1,.37);
 bar(0,2.82,.12,.32,eyeMat,.5);
 // Midface connector, separate cheek armor, articulated jaw and paired temple wings.
 plate([[-1.52,.63],[-.57,1.02],[0,.43],[.57,1.02],[1.52,.63],[1.63,-.62],[.83,-1.17],[0,-1.36],[-.83,-1.17],[-1.63,-.62]],darkSteel,.17,.17);
 const wings=[];
 for(const dir of [-1,1]){
  const wing=new THREE.Group();root.add(wing);wing.position.set(dir*1.5,.58,.15);
  const local=dir===-1?1:-1;
  plate([[0,1.96],[local*.58,1.78],[local*.7,.72],[local*.48,-.85],[local*.12,-1.63],[local*-.16,-.95],[local*-.35,.55]],steel,.2,.1,wing);
  bar(local*.43,.44,.06,1.18,bronze,.38,wing,local*.12);
  bar(local*.29,-.78,.07,.32,eyeMat,.42,wing);
  wings.push(wing);
  plate([[dir*.43,-1.1],[dir*1.32,-.75],[dir*1.57,-1.36],[dir*1.2,-2.13],[dir*.66,-2.45],[dir*.25,-1.92]],steel,.2,.05);
  bar(dir*1.12,-1.86,.11,.66,copper,.36,root,dir*.42);
 }
 const nose=plate([[-.35,-.37],[0,-.16],[.35,-.37],[.5,-1.05],[0,-1.36],[-.5,-1.05]],copper,.19,.41);
 plate([[-.18,-.47],[0,-.38],[.18,-.47],[.25,-.85],[0,-1.08],[-.25,-.85]],darkSteel,.13,.67);
 const jaw=new THREE.Group();root.add(jaw);
 jaw.position.set(0,-1.5,.18);
 plate([[-1.32,-.1],[-.64,.14],[0,-.08],[.64,.14],[1.32,-.1],[1.12,-1.22],[.45,-1.86],[0,-2.12],[-.45,-1.86],[-1.12,-1.22]],steel,.2,0,jaw);
 plate([[-.73,-.33],[0,-.51],[.73,-.33],[.66,-1.14],[0,-1.57],[-.66,-1.14]],obsidian,.15,.3,jaw);
 const mouth=bar(0,-2.32,.84,.055,bronze,.55);
 mouth.parent.remove(mouth);jaw.add(mouth);mouth.position.y=-.82;
 const lip=bar(0,-3.05,.43,.035,copper,.51);
 lip.parent.remove(lip);jaw.add(lip);lip.position.y=-1.55;
 const eyes=[],brows=[];
 for(const d of [-1,1]){
  const group=new THREE.Group();root.add(group);group.position.set(d*.9,.35,.66);
  const s=d;
  plate([[-.59*s,.16],[.6*s,.25],[.48*s,-.04],[-.37*s,-.3]],obsidian,.12,0,group);
  const glow=plate([[-.5*s,.06],[.48*s,.13],[.38*s,-.02],[-.31*s,-.19]],eyeMat,.035,.19,group);
  bar(0,.07,.6,.025,innerGlow,.34,group,s*.07);
  eyes.push(group);
  const brow=bar(d*.93,.91,1.05,.1,bronze,.8,root,d*.1);
  brows.push(brow);
  // Subsurface micro-LEDs
  bar(d*1.55,-.46,.08,.39,innerGlow,.66,root,d*.2);
 }
 const socket=plate([[-.48,-3.12],[0,-3.47],[.48,-3.12],[.3,-3.32],[-.3,-3.32]],copper,.14,-.2);
 // Metallic notches, tiny vents, and a chestless neck accent supply scale.
 for(const d of [-1,1]){
  for(let j=0;j<3;j++)bar(d*(.68+j*.18),2.06-j*.04,.13,.025,copper,.56,root,d*.15);
  for(let j=0;j<3;j++)bar(d*(1.13+j*.07),-1.14-j*.19,.055,.12,bronze,.35);
 }
 let active=true,visible=true,ready=false,frame=0,currentState='idle',last=0;
 const pose={blink:1,tilt:0,jaw:0,wing:0,eyeGlow:1,y:0};
 let target={...pose};
 function updateTarget(state){
  currentState=state;
  const next={blink:1,tilt:0,jaw:0,wing:0,eyeGlow:1,y:0};
  if(state==='sleep'){next.blink=.04;next.eyeGlow=.14;next.y=-.09}
  if(state==='listening'){next.blink=1.06;next.wing=.13;next.eyeGlow=1.18;next.tilt=.02}
  if(state==='thinking'){next.blink=.68;next.tilt=-.075;next.eyeGlow=.78}
  if(state==='confused'){next.tilt=.12;next.wing=.22;next.blink=.72}
  if(state==='happy'){next.blink=.58;next.wing=-.11;next.eyeGlow=1.12;next.jaw=.09}
  if(state==='speaking'){next.jaw=.19;next.eyeGlow=1.04}
  target=next;
 }
 function size(){
  const rect=wrap.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);
  const aspect=rect.width/rect.height,half=4.65;
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
  camera.updateProjectionMatrix();
 }
 function shouldRender(){return active && visible && !document.hidden && prefs().avatar!=='2d'}
 function frameLoop(now){
  requestAnimationFrame(frameLoop);
  if(!shouldRender())return;
  if(now-last<33 && ready)return;last=now;
  const motion=!!prefs().motion&&!prefersLess.matches,amount=motion ? .09 : 1;
  for(const k of Object.keys(pose))pose[k]=THREE.MathUtils.lerp(pose[k],target[k],amount);
  const t=now*.001;
  const bob=motion?Math.sin(t*.85)*.055:0;
  root.position.y=bob+pose.y;
  root.rotation.y=motion?Math.sin(t*.37)*.07:0;
  root.rotation.z=pose.tilt+(motion?Math.sin(t*.45)*.012:0);
  for(let i=0;i<2;i++){
   eyes[i].scale.y=Math.max(.045,pose.blink);
   wings[i].rotation.z=(i===0?-1:1)*pose.wing;
   brows[i].rotation.z=(i===0?-1:1)*(pose.tilt+.06);
  }
  jaw.position.y=-1.5-pose.jaw-(motion&&currentState==='speaking'?(Math.sin(t*17)+1)*.085:0);
  eyeMat.opacity=Math.min(1,Math.max(.15,pose.eyeGlow));
  rim.intensity=motion&&currentState==='listening'?20+Math.sin(t*5)*5:20;
  renderer.render(scene,camera);
  if(!ready){ready=true;wrap.classList.add('mek-3d-ready')}
 }
 function syncMode(){
  active=prefs().avatar!=='2d';
  if(!active)wrap.classList.remove('mek-3d-ready');
  else if(ready)wrap.classList.add('mek-3d-ready');
  size();
 }
 const resize=new ResizeObserver(size);resize.observe(wrap);
 const intersection=new IntersectionObserver(records=>{visible=records[0]?.isIntersecting??true; if(visible)size()},{threshold:0});intersection.observe(wrap);
 window.addEventListener('mek-preferences',syncMode);
 window.addEventListener('mek-face-state',e=>updateTarget(e.detail.state));
 const legacy=document.querySelector('#eye');
 const readLegacy=()=>((legacy?.getAttribute('class')||'').match(/state-([a-z]+)/)||[])[1]||'idle';
 updateTarget(readLegacy());
 if(legacy)new MutationObserver(()=>updateTarget(readLegacy())).observe(legacy,{attributes:true,attributeFilter:['class']});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;ready=false;wrap.classList.remove('mek-3d-ready')});
 size();syncMode();requestAnimationFrame(frameLoop);
}
