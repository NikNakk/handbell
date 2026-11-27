/* Handbell diagnostic capture. No network requests or microphone access. */
const HAND_BELL_TRIALS=[
 {id:'rest',name:'1. Rest and slow tilt',seconds:10,expected:0,guide:'Hold the phone upright, still for 4 seconds. Then slowly tilt it forward and back once. Do not try to ring it.'},
 {id:'forward',name:'2. Five separate forward flicks',seconds:15,expected:5,guide:'Hold the phone upright, screen facing you. Make five individual forward wrist flicks, returning gently and pausing about 2 seconds between each. Aim for one ring per flick.'},
 {id:'side',name:'3. Five separate sideways flicks',seconds:15,expected:5,guide:'Make five separate side-to-side wrist flicks, with a gentle return and a pause of about 2 seconds between each. Aim for one ring per flick.'},
 {id:'soft',name:'4. Soft to hard',seconds:15,expected:5,guide:'Make five separate flicks in your natural direction: very gentle, gentle, medium, strong, then firm (not violent). Pause between flicks.'},
 {id:'rhythm',name:'5. Continuous rhythm',seconds:12,expected:8,guide:'Make eight deliberate alternating swings, roughly two per second, then hold still. Aim for one strike in each direction.'},
 {id:'natural',name:'6. Natural ringing / reproduce problem',seconds:20,expected:null,guide:'Ring as you naturally would. Try to reproduce missed, late or double strikes. You can stop early. Add a note describing what you noticed.'}
];
class HandbellDiagnostics {
 constructor(deps){
  this.d=deps;this.active=null;this.pending=null;this.trials=[];this.timer=null;this.tick=null;this.maxSamples=12000;
  const $=deps.$;
  this.select=$('diagTrial');
  for(const t of HAND_BELL_TRIALS){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;this.select.append(o)}
  this.select.addEventListener('change',()=>this.refresh());
  $('diagStart').addEventListener('click',()=>this.start());
  $('diagStop').addEventListener('click',()=>this.stop('manual'));
  $('diagExport').addEventListener('click',()=>this.export(false));
  $('diagShare').addEventListener('click',()=>this.export(true));
  $('diagClear').addEventListener('click',()=>{if(this.active||this.pending)return; if(this.trials.length&&!confirm('Discard all captured trials?'))return;this.trials=[];this.refresh()});
  this.refresh();
 }
 selected(){return HAND_BELL_TRIALS.find(t=>t.id===this.select.value)||HAND_BELL_TRIALS[0]}
 status(s){this.d.$('diagStatus').textContent=s}
 refresh(){
  const $=this.d.$,t=this.selected(),running=!!(this.active||this.pending);
  $('diagGuide').textContent=t.guide+' ('+t.seconds+' seconds; '+(t.expected===null?'no fixed count':t.expected+' intended rings')+').';
  this.select.disabled=running;$('diagStart').disabled=running;$('diagStop').disabled=!running;
  $('diagExport').disabled=running||!this.trials.length;$('diagShare').disabled=running||!this.trials.length;$('diagClear').disabled=running||!this.trials.length;
  $('diagResults').replaceChildren();
  for(const [i,trial] of this.trials.entries()){
   const block=document.createElement('div');block.className='diagResult';
   const h=document.createElement('p');h.textContent=trial.name+' — '+trial.samples.length+' samples · '+trial.events.filter(e=>e.type==='audio-start'&&e.origin==='motion').length+' rings scheduled';h.style.fontWeight='600';block.append(h);
   const label=document.createElement('label');label.textContent='How many rings did you hear? (optional)';label.className='sub';const input=document.createElement('input');input.type='number';input.min='0';input.max='999';input.inputMode='numeric';input.value=trial.heardCount??'';input.addEventListener('input',()=>{trial.heardCount=input.value===''?null:Number(input.value)});label.append(input);block.append(label);
   const notes=document.createElement('label');notes.className='sub';notes.textContent='Notes (misses, doubles, delay, grip)';const ta=document.createElement('textarea');ta.rows=2;ta.placeholder='e.g. first two flicks rang twice';ta.value=trial.notes;ta.addEventListener('input',()=>trial.notes=ta.value);notes.append(ta);block.append(notes);$('diagResults').append(block);
  }
  $('diagTotal').textContent=this.trials.length+' trial'+(this.trials.length===1?'':'s')+' recorded';
 }
 start(){
  if(this.active||this.pending)return;
  if(!this.d.enabled()){this.status('Enable motion & sound first, then start the test.');return}
  this.pending=this.selected();this.refresh();
  const end=performance.now()+3000;
  this.status('Get ready — recording in 3 seconds. Hold the phone still.');
  this.tick=setInterval(()=>this.status('Get ready — '+Math.max(1,Math.ceil((end-performance.now())/1000))+' seconds'),150);
  this.timer=setTimeout(()=>this.begin(),3000);
 }
 begin(){
  clearInterval(this.tick);clearTimeout(this.timer);
  const t=this.pending;this.pending=null;
  if(!t||!this.d.enabled()||document.hidden){this.status('Test cancelled: motion disabled or app hidden.');this.refresh();return}
  this.d.detector.reset();
  const start=performance.now();
  const a=this.d.audio();
  this.active={id:t.id,name:t.name,guide:t.guide,expected:t.expected,plannedSeconds:t.seconds,start,settings:this.d.settings(),screenAngle:screen.orientation?.angle??window.orientation??null,
   audio:{sampleRate:a?.sampleRate??null,baseLatency:a?.baseLatency??null,outputLatency:a?.outputLatency??null},samples:[],events:[{t:0,type:'detector-reset',reason:'trial-start'}],heardCount:null,notes:''};
  this.status('RECORDING — '+t.seconds+' seconds. Begin now.');
  this.tick=setInterval(()=>{if(!this.active)return;const remaining=Math.max(0,Math.ceil(t.seconds-(performance.now()-start)/1000));this.status('RECORDING — '+remaining+' seconds · '+this.active.samples.length+' samples')},250);
  this.timer=setTimeout(()=>this.stop('complete'),t.seconds*1000);
 }
 finite(v){return typeof v==='number'&&Number.isFinite(v)?v:null}
 values(o,keys){return Object.fromEntries(keys.map(k=>[k,this.finite(o?.[k])]))}
 event(type,extra={},now=performance.now()){
  if(!this.active)return;
  this.active.events.push({t:now-this.active.start,type,...extra});
 }
 capture(e,now,result,detector,settings){
  const t=this.active;if(!t)return;
  const f=v=>this.finite(v);
  t.samples.push({t:now-t.start,eventTimestamp:f(e.timeStamp),interval:f(e.interval),
   acceleration:this.values(e.acceleration,['x','y','z']),
   accelerationIncludingGravity:this.values(e.accelerationIncludingGravity,['x','y','z']),
   rotationRate:this.values(e.rotationRate,['alpha','beta','gamma']),
   screenAngle:screen.orientation?.angle??window.orientation??null,
   settings,holding:this.d.holding(),result:result?{...result}:null,
   state:{q:detector.q.slice(),v:detector.v.slice(),omega:detector.lastOmega?.slice()??null,alpha:detector.alpha.slice(),filteredAcceleration:detector.lastA.slice(),locked:detector.locked,lockDirection:detector.lockDirection?.slice()??null,lastSide:detector.lastSide,lastStrike:f(detector.lastStrike-t.start),lastGesture:f(detector.lastGesture-t.start),quietSince:detector.quietSince===null?null:f(detector.quietSince-t.start),reversalSince:detector.reversalSince===null?null:f(detector.reversalSince-t.start),boundary:f(detector.lastBoundary)}});
  if(t.samples.length>=this.maxSamples)this.stop('sample-limit');
 }
 stop(reason='manual'){
  clearTimeout(this.timer);clearInterval(this.tick);
  if(this.pending){this.pending=null;this.status('Countdown cancelled.');this.refresh();return}
  if(!this.active)return;
  const t=this.active;this.active=null;t.durationMs=performance.now()-t.start;t.endReason=reason;
  delete t.start;this.trials.push(t);
  const rings=t.events.filter(e=>e.type==='audio-start'&&e.origin==='motion').length;
  this.status('Recorded '+t.samples.length+' samples and '+rings+' motion-triggered rings. '+(t.samples.length===0?'No sensor data received. Enable motion and repeat.':'Add any observations below, then choose the next test.'));
  const i=HAND_BELL_TRIALS.findIndex(x=>x.id===t.id);if(reason==='complete'&&i>=0&&i<HAND_BELL_TRIALS.length-1)this.select.value=HAND_BELL_TRIALS[i+1].id;
  this.refresh();
 }
 data(){return {schemaVersion:1,appVersion:6,detectorVersion:5,exportedAt:new Date().toISOString(),
   device:{userAgent:navigator.userAgent,platform:navigator.platform,standalone:!!(navigator.standalone||matchMedia('(display-mode: standalone)').matches)},
   units:{t:'ms relative to beginning of trial',eventTimestamp:'browser event timeStamp, ms',acceleration:'m/s²',rotationRate:'degrees/s',q:'radians',v:'radians/s',audioTime:'AudioContext seconds'},
   deviceNotes:this.d.$('diagDevice').value, trials:this.trials};}
 async export(share){
  if(this.active||this.pending||!this.trials.length)return;
  const name='handbell-diagnostics-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
  const blob=new Blob([JSON.stringify(this.data())],{type:'application/json'});
  if(share&&typeof navigator.share==='function'&&typeof File==='function'){
   const file=new File([blob],name,{type:'application/json'});
   try{if(!navigator.canShare||navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Handbell motion diagnostics'});return}}catch(e){if(e.name==='AbortError')return;}
  }
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  this.status('Export requested. Save the JSON file to Files or Downloads and attach it to ChatGPT.');
 }
}
