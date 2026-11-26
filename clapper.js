/* Virtual hinged clapper, in the phone's x-y plane. Android/iOS
 * rotationRate.alpha = rotation around z, beta = x, gamma = y.
 * Bell handle is at the top of the screen; the clapper hangs toward -y.
 * A second plane (z-y) supports forward/back wrist flicks.
 * All angles are radians; acceleration is m/s². */
class StrikeDetector {
  constructor(){this.reset()}
  reset(){
    this.q=[0,0];this.v=[0,0];this.lastTime=null;this.lastOmega=null;
    this.alpha=[0,0];this.lastStrike=-Infinity;this.lastSide=0;this.readyAt=null;
    this.locked=false;this.lockDirection=null;this.quietSince=null;this.reversalSince=null;this.lastGesture=-Infinity;this.lastRaw=null;this.gravity=null;this.lastA=[0,0,0];this.contact=0;this.lastBoundary=null;
  }
  sample(event,now,sensitivity,mode='free',axis='both'){
    const raw=vector(event.accelerationIncludingGravity,['x','y','z']);
    const linear=vector(event.acceleration,['x','y','z']);
    const rates=vector(event.rotationRate,['alpha','beta','gamma']);
    if(!raw&&!linear&&!rates)return null;
    const rad=Math.PI/180;
    const omega=rates?[rates[0]*rad,-rates[1]*rad]:[0,0];
    if(this.lastTime===null||now-this.lastTime>180){
      this.reset();this.lastTime=now;this.lastOmega=omega;this.readyAt=now+48;
      return {strike:0,level:0,tilt:0,clapper:0};
    }
    const dt=clamp((now-this.lastTime)/1000,.004,.06);this.lastTime=now;
    const s=clamp(sensitivity,0,100)/100;
    const limit=(mode==='tuned'?.15:.18)-.07*s;
    const length=.05;const drive=1.5+1.5*s;
    const spring=mode==='tuned'?52:14;const damping=mode==='tuned'?6.5:4.8;
    const blend=1-Math.exp(-dt/.006);
    const apparent=raw||linear||[0,0,0];
    const jerk=raw&&this.lastRaw?Math.hypot(...raw.map((a,i)=>(a-this.lastRaw[i])/dt)):0;
    this.lastRaw=raw;
    if(Math.hypot(...omega)>.65 || (linear&&Math.hypot(...linear)>1.7) || jerk>24)this.lastGesture=now;
    this.lastA=this.lastA.map((a,i)=>a+blend*(apparent[i]-a));
    this.alpha=this.alpha.map((a,i)=>a+blend*(clamp((omega[i]-this.lastOmega[i])/dt,-450,450)-a));
    this.lastOmega=omega;
    if(this.lastBoundary!==limit){this.q=this.q.map(q=>clamp(q,-limit*.98,limit*.98));this.lastBoundary=limit;}
    const axes=mode==='tuned'?(axis==='side'?[0]:[1]):axis==='side'?[0]:axis==='forward'?[1]:[0,1];
    for(let i=0;i<2;i++)if(!axes.includes(i)){this.q[i]=0;this.v[i]=0;}
    // One audible impact per wrist swing. Acceleration changes sign during
    // braking, but angular velocity does not: do not rearm on clapper bounce.
    const motion=omega.map((v,i)=>axes.includes(i)?v:0);
    const speed=Math.hypot(...motion);
    const acceleration=linear?Math.hypot(...linear):0;
    const quiet=speed<.32&&acceleration<.8&&jerk<12;
    if(this.locked){
      if(quiet){
        if(this.quietSince===null)this.quietSince=now;
        if(now-this.quietSince>=64){
          this.locked=false;this.lockDirection=null;this.lastGesture=-Infinity;
          this.q=[0,0];this.v=[0,0];
        }
      }else this.quietSince=null;
      if(this.lockDirection&&speed>.85){
        const dot=motion[0]*this.lockDirection[0]+motion[1]*this.lockDirection[1];
        if(dot<-.7*speed){
          if(this.reversalSince===null)this.reversalSince=now;
          if(now-this.reversalSince>=12&&now-this.lastStrike>=80){
            this.locked=false;this.lockDirection=null;this.reversalSince=null;
            this.q=[0,0];this.v=[0,0];
          }
        }else this.reversalSince=null;
      }else this.reversalSince=null;
    }
    let impact=0;
    const steps=Math.ceil(dt/.0025),h=dt/steps;
    for(let step=0;step<steps;step++){
      for(const i of axes){
        const q=this.q[i],v=this.v[i],a=this.lastA[i===0?0:2],along=this.lastA[1];
        // Effective acceleration includes gravity and translational inertia.
        // Relative angular acceleration also includes the rotation of the bell body.
        const force=drive*(-a*Math.cos(q)/length-this.alpha[i])+
          -along*Math.sin(q)/length-spring*q-damping*v+
          omega[i]*omega[i]*Math.sin(q)*.3;
        this.v[i]=clamp(v+h*force,-45,45);
        this.q[i]+=h*this.v[i];
      }
      const radius=Math.hypot(...this.q);
      if(radius>=limit){
        const n=this.q.map(q=>q/radius);
        const vn=this.v[0]*n[0]+this.v[1]*n[1];
        this.q=n.map(x=>x*limit);
        if(vn>0){
          const bounce=mode==='tuned'?.18:.28;
          this.v=this.v.map((v,i)=>v-(1+bounce)*vn*n[i]);
          // A slow tilt or a clapper resting against the casting is not a strike.
          const side=Math.abs(n[0])>Math.abs(n[1])?(n[0]>0?1:-1):(n[1]>0?2:-2);
          const refractory=side===this.lastSide?85:35;
          if(!this.locked&&vn>.8-.25*s&&now-this.lastGesture<100&&now>=this.readyAt&&now-this.lastStrike>=refractory){
            impact=Math.max(impact,clamp((vn/12)**.72,.13,1));
            this.lastStrike=now;this.lastSide=side;this.locked=true;
            this.lockDirection=speed>.45?motion.map(v=>v/speed):null;this.quietSince=null;this.reversalSince=null;
          }
        }
      }
    }
    return {strike:impact,level:Math.hypot(...this.q)/limit,
      tilt:clamp(omega[0]*5,-22,22),clapper:clamp(this.q[0]/limit*32,-32,32)};
  }
}
