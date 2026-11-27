/* Adaptive strike detector: all three gyro axes in unrestricted mode,
 * an acceleration gate, and hysteresis with a decaying previous-peak threshold.
 * This experimental alternative was tuned against real iPhone motion recordings. */
class AdaptiveSwing {
  constructor(){this.reset()}
  reset(){this.prev=null;this.begin=null;this.armed=true;this.env=0;this.peak=0;this.peakTime=0;this.reference=0;this.last=-Infinity;this.quiet=null;this.threshold=0;}
  sample(e,now,sensitivity,style,axis){
    const r=e.rotationRate,a=e.acceleration;
    const valid=(o,keys)=>o&&keys.every(k=>typeof o[k]==='number'&&Number.isFinite(o[k]));
    const hasR=valid(r,['alpha','beta','gamma']),hasA=valid(a,['x','y','z']);
    if(!hasR&&!hasA)return null;
    const s=Math.max(0,Math.min(100,sensitivity));
    const base=140*Math.pow(2,(65-s)/65),minA=4*Math.pow(2,(65-s)/65);
    const acc=hasA?Math.hypot(a.x,a.y,a.z):0;
    const speed=hasR?(axis==='side'?Math.abs(r.alpha):axis==='forward'?Math.abs(r.beta):Math.hypot(r.alpha,r.beta,r.gamma)):acc*35;
    let dt=this.prev===null?16:now-this.prev;
    if(this.prev===null||dt>180){this.reset();this.begin=now;this.env=speed;dt=16;}
    this.prev=now;this.env+=(1-Math.exp(-Math.max(1,Math.min(dt,60))/8))*(speed-this.env);
    const dead=145,rel=style==='alternating'?.65:1;
    if(!this.armed){
      if(this.env>this.peak){this.peak=this.env;this.peakTime=now;}
      if(this.env<Math.max(65,this.peak*.25)&&now-this.last>=dead){this.armed=true;this.reference=this.peak;this.quiet=null;}
    }else{
      if(this.env<65&&(!hasA||acc<2)){
        if(this.quiet===null)this.quiet=now;
        if(now-this.quiet>120)this.reference=0;
      }else this.quiet=null;
      this.threshold=Math.max(base,this.reference*rel*Math.pow(2,-Math.max(0,now-this.peakTime)/500));
      if(this.env>=this.threshold&&(!hasA||acc>=minA)&&now-this.begin>=32&&now-this.last>=dead){
        this.armed=false;this.peak=this.env;this.peakTime=now;this.last=now;
        return Math.max(.18,Math.min(1,.24+.76*Math.pow(Math.max(this.env/850,acc/45),.7)));
      }
    }
    return 0;
  }
  snapshot(){return {armed:this.armed,filteredSpeed:this.env,peakSpeed:this.peak,referenceSpeed:this.reference,threshold:this.threshold};}
}
