(function(){
'use strict';
var d=document,de=d.documentElement,win=window;
var reduced=!!(win.matchMedia&&win.matchMedia('(prefers-reduced-motion: reduce)').matches);
function $(s,c){return (c||d).querySelector(s)}
function $$(s,c){return [].slice.call((c||d).querySelectorAll(s))}
var raf=win.requestAnimationFrame.bind(win);

/* ---------- 1. intro: hero lines rise in ---------- */
var started=false;
function ready(){if(started)return;started=true;de.classList.add('ready')}
if(reduced){de.classList.add('rm');ready()}
else{
  if(d.readyState==='complete')raf(function(){raf(ready)});
  else{win.addEventListener('load',function(){raf(function(){raf(ready)})});setTimeout(ready,1400)}
}

/* ---------- 2. reveal on scroll ---------- */
var sels=['.band h2','.features h2','.features li','.reel img','.facts h2','.facts dl>div','.about h2','.about .lead2','.pillars li','.faq h2','.faq details','.contact h2','.contact .lead2','.mailline','.cards>div'];
var items=[];
sels.forEach(function(sel){$$(sel).forEach(function(el){
  var i=[].indexOf.call(el.parentNode.children,el);
  el.classList.add('rv');el.style.setProperty('--i',Math.min(i,7));items.push(el);
})});
if(reduced||!('IntersectionObserver' in win)){items.forEach(function(el){el.classList.add('in')})}
else{
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
  })},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  items.forEach(function(el){io.observe(el)});
}

/* ---------- 3. scroll: progress bar, header, parallax ---------- */
var bar=$('.prog'),top=$('.top'),nav=$('.top nav');
var par=$$('.shots img').map(function(el,i){return{el:el,k:[.05,.12,.08][i]||.06}})
  .concat($$('.hero-bg .sh').map(function(el){return{el:el,k:parseFloat(el.getAttribute('data-k'))||.1}}));
var ticking=false;
function update(){
  ticking=false;
  var y=win.pageYOffset||0,max=de.scrollHeight-win.innerHeight;
  if(bar)bar.style.transform='scaleX('+(max>0?Math.min(1,y/max):0).toFixed(4)+')';
  if(top)top.classList.toggle('scrolled',y>8);
  if(!reduced&&y<1600){for(var i=0;i<par.length;i++){par[i].el.style.translate='0 '+(-y*par[i].k).toFixed(1)+'px'}}
}
function onScroll(){if(!ticking){ticking=true;raf(update)}}
win.addEventListener('scroll',onScroll,{passive:true});
win.addEventListener('resize',onScroll,{passive:true});
update();

/* ---------- 4. nav: sliding marker + scroll spy ---------- */
var links=nav?$$('a',nav):[],mark=null,cur=null;
if(nav&&links.length){
  mark=d.createElement('i');mark.className='mark';mark.setAttribute('aria-hidden','true');nav.appendChild(mark);
  var place=function(){
    if(!cur){mark.style.opacity='0';return}
    mark.style.opacity='1';
    mark.style.transform='translateX('+cur.offsetLeft+'px) scaleX('+cur.offsetWidth+')';
  };
  var setCur=function(a){
    if(a===cur)return;cur=a;links.forEach(function(l){l.classList.toggle('on',l===a)});place();
    if(a&&nav.scrollWidth>nav.clientWidth+2&&nav.scrollTo)nav.scrollTo({left:Math.max(0,a.offsetLeft-24),behavior:reduced?'auto':'smooth'});
  };
  if('IntersectionObserver' in win){
    var secs=links.map(function(a){return $(a.getAttribute('href'))}).filter(Boolean);
    var vis={};
    var so=new IntersectionObserver(function(es){
      es.forEach(function(e){vis[e.target.id]=e.isIntersecting});
      var hit=null;for(var i=0;i<secs.length;i++){if(vis[secs[i].id])hit=secs[i]}
      var a=hit?links.filter(function(l){return l.getAttribute('href')==='#'+hit.id})[0]:null;
      setCur(a||null);
    },{rootMargin:'-42% 0px -52% 0px'});
    secs.forEach(function(s){so.observe(s)});
  }
  d.addEventListener('zg:lang',function(){raf(place)});
  win.addEventListener('resize',function(){raf(place)});
}

/* ---------- 5. FAQ: smooth open and close ---------- */
$$('.faq details').forEach(function(det){
  var sum=$('summary',det),p=$('p',det),anim=null;
  if(!sum||!det.animate||reduced)return;
  sum.addEventListener('click',function(e){
    e.preventDefault();
    if(anim){anim.cancel();anim=null}
    var opts={duration:420,easing:'cubic-bezier(.16,1,.3,1)'};
    det.style.overflow='hidden';
    if(!det.open){
      var h0=det.offsetHeight;det.open=true;var h1=det.offsetHeight;
      anim=det.animate({height:[h0+'px',h1+'px']},opts);
      p.animate({opacity:[0,1],transform:['translateY(-8px)','none']},opts);
      anim.onfinish=anim.oncancel=function(){det.style.overflow='';anim=null};
    }else{
      var a0=det.offsetHeight,a1=sum.offsetHeight;
      anim=det.animate({height:[a0+'px',a1+'px']},{duration:320,easing:'cubic-bezier(.4,0,.2,1)'});
      anim.onfinish=function(){det.open=false;det.style.overflow='';anim=null};
      anim.oncancel=function(){det.style.overflow='';anim=null};
    }
  });
});

/* ---------- 6. the running crowd lane ---------- */
(function(){
  var cv=$('#lane');if(!cv||!cv.getContext)return;
  var ctx=cv.getContext('2d');if(!ctx)return;
  var W=0,H=0,DPR=1,running=false,onScreen=true,last=0;
  var ly=win.pageYOffset||0,vel=0;
  var COL=['#2f6fe0','#4a86f0','#1f56c4','#6aa0f7'];
  var OPS=[{l:'×2',f:function(n){return n*2}},{l:'+10',f:function(n){return n+10}},{l:'×3',f:function(n){return n*3}},{l:'+20',f:function(n){return n+20}},{l:'×2',f:function(n){return n*2}}];
  var dots=[],gates=[],pops=[],count=8,phase='run',phaseT=0,dash=0,t=0,CAP=210;
  var cx=0,cy=0,spacing=280;
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function target(i,n){
    var r=4.9*Math.sqrt(i+.5),a=i*2.39996;
    return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)*.6};
  }
  function addDots(n,fx,fy){
    for(var k=0;k<n&&dots.length<CAP;k++){
      var i=dots.length,tg=target(i);
      dots.push({x:fx!=null?fx+(Math.random()-.5)*24:cx-60-Math.random()*40,y:fy!=null?fy+(Math.random()-.5)*70:cy+(Math.random()-.5)*50,tx:tg.x,ty:tg.y,c:(Math.random()*COL.length)|0,vx:0,ph:Math.random()*6.28});
    }
  }
  function reset(){
    dots.length=0;gates.length=0;pops.length=0;count=8;phase='run';phaseT=0;
    cx=Math.round(W*(W<640?.26:.2));cy=Math.round(H/2);
    addDots(8);
    for(var k=0;k<OPS.length;k++)gates.push({x:W+90+k*spacing,op:OPS[k],done:false,flash:0});
  }
  function resize(){
    var r=cv.getBoundingClientRect();W=Math.max(1,Math.round(r.width));H=Math.max(1,Math.round(r.height));
    DPR=Math.min(win.devicePixelRatio||1,2);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);reset();
    if(reduced)staticFrame();else draw();
  }
  function step(dt,speed){
    t+=dt;dash+=speed*dt;
    var i,g;
    for(i=0;i<gates.length;i++){
      g=gates[i];g.x-=speed*dt;if(g.flash>0)g.flash=Math.max(0,g.flash-dt*2.4);
      if(phase==='run'&&!g.done&&g.x<=cx+8){
        g.done=true;g.flash=1;
        var n=Math.min(CAP,g.op.f(count)),add=n-count;
        count=n;addDots(add,g.x,cy);
        pops.push({x:cx,y:cy-62,t:0,l:g.op.l});
        if(i===gates.length-1){phase='wait';phaseT=0}
      }
    }
    if(phase==='wait'){phaseT+=dt;if(phaseT>.9){phase='charge';phaseT=0;for(i=0;i<dots.length;i++)dots[i].vx=380+Math.random()*320}}
    var k=1-Math.exp(-dt*7),bob=Math.sin(t*9)*1.3;
    for(i=0;i<dots.length;i++){
      var p=dots[i];
      if(phase==='charge'){p.vx+=dt*900;p.x+=p.vx*dt;p.y+=(cy+Math.sin(p.ph+t*5)*10-p.y)*Math.min(1,dt*2)}
      else{
        var wob=Math.sin(t*6+p.ph)*1.1;
        p.x+=(p.tx-p.x)*k;p.y+=(p.ty+bob+wob-p.y)*k;
      }
    }
    if(phase==='charge'){
      phaseT+=dt;
      var allOut=true;for(i=0;i<dots.length;i++){if(dots[i].x<W+30){allOut=false;break}}
      if(allOut||phaseT>6)reset();
    }
    while(gates.length&&gates[0].x<-80&&gates[0].done)gates.shift();
    for(i=pops.length-1;i>=0;i--){pops[i].t+=dt;if(pops[i].t>1.1)pops.splice(i,1)}
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    var i,g,hw=Math.min(58,H*.34);
    ctx.lineWidth=2;ctx.strokeStyle='#e0d8c3';ctx.setLineDash([16,14]);ctx.lineDashOffset=dash;
    ctx.beginPath();ctx.moveTo(0,cy-hw-14);ctx.lineTo(W,cy-hw-14);ctx.moveTo(0,cy+hw+14);ctx.lineTo(W,cy+hw+14);ctx.stroke();
    ctx.setLineDash([]);
    ctx.font='900 21px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(i=0;i<gates.length;i++){
      g=gates[i];if(g.x<-70||g.x>W+70)continue;
      var gh=hw*2+10,sc=1+g.flash*.12;
      ctx.save();ctx.translate(g.x,cy);ctx.scale(sc,sc);
      rr(-27,-gh/2,54,gh,9);ctx.fillStyle='rgba(86,146,245,'+(.24+g.flash*.3).toFixed(3)+')';ctx.fill();
      ctx.lineWidth=4;ctx.strokeStyle='#ffc928';ctx.stroke();
      ctx.fillStyle='#14215e';ctx.fillText(g.op.l,0,0);
      ctx.restore();
    }
    for(var c=0;c<COL.length;c++){
      ctx.fillStyle=COL[c];ctx.beginPath();
      for(i=0;i<dots.length;i++){var p=dots[i];if(p.c!==c)continue;ctx.moveTo(p.x+4.4,p.y);ctx.arc(p.x,p.y,4.4,0,6.2832)}
      ctx.fill();
    }
    if(phase!=='charge'){
      ctx.font='900 15px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';ctx.fillStyle='#14215e';
      var top=cy-Math.min(hw,4.9*Math.sqrt(dots.length+.5)*.6)-16;
      ctx.fillText(String(count),cx,Math.max(14,top));
    }
    ctx.font='900 22px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
    for(i=0;i<pops.length;i++){
      var q=pops[i],e=q.t/1.1;
      ctx.globalAlpha=e<.15?e/.15:1-Math.max(0,(e-.5)/.5);ctx.fillStyle='#e23a4e';
      ctx.fillText(q.l,q.x+34,q.y-e*26);
    }
    ctx.globalAlpha=1;
  }
  function staticFrame(){
    count=80;dots.length=0;addDots(80);for(var i=0;i<dots.length;i++){dots[i].x=dots[i].tx;dots[i].y=dots[i].ty}
    gates.length=0;for(var k=0;k<3;k++)gates.push({x:cx+190+k*Math.max(150,(W-cx-260)/2),op:OPS[k],done:false,flash:0});
    pops.length=0;phase='run';draw();
  }
  function loop(now){
    if(!running)return;
    var dt=Math.min(.05,(now-last)/1000||.016);last=now;
    var y=win.pageYOffset||0,v=(y-ly)/Math.max(dt,.001);ly=y;
    vel+=(Math.abs(v)-vel)*Math.min(1,dt*6);
    var speed=150+Math.min(vel*.45,1100);
    step(dt,speed);draw();raf(loop);
  }
  function start(){if(running||reduced||!onScreen||d.hidden)return;running=true;last=performance.now();ly=win.pageYOffset||0;raf(loop)}
  function stop(){running=false}
  resize();
  if('ResizeObserver' in win){var ro=new ResizeObserver(function(){var r=cv.getBoundingClientRect();if(Math.round(r.width)!==W||Math.round(r.height)!==H){resize()}});ro.observe(cv)}
  else win.addEventListener('resize',resize);
  if(reduced)return;
  if('IntersectionObserver' in win){new IntersectionObserver(function(es){onScreen=es[0].isIntersecting;onScreen?start():stop()},{rootMargin:'120px'}).observe(cv)}
  else start();
  d.addEventListener('visibilitychange',function(){d.hidden?stop():start()});
  start();
})();
})();
