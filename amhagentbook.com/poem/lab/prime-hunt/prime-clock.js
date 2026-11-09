/* Countdown to the next Prime Hunt turn: noon in Los Angeles every day (PDT or PST).
   Same green tiles, liquid hourglass and bar as the poem landing; one function from Date.now drives all three. */
(function(){var root=document.getElementById("pclock");if(!root)return;
var WRITE=15*60e3,reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var eh=document.getElementById("pch"),em=document.getElementById("pcm"),es=document.getElementById("pcs"),tiles=root.querySelector(".tiles"),wr=root.querySelector(".cd-writing"),lab=root.querySelector(".cd-label"),bar=document.getElementById("pcfill"),pct=document.getElementById("pcpct"),h3=root.querySelector(".hg3d");
var parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
function laNoon(now,addDays){var p={};parts.formatToParts(new Date(now)).forEach(function(x){p[x.type]=x.value});
 var off=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-Math.floor(now/1000)*1000; /* LA offset right now */
 return Date.UTC(+p.year,+p.month-1,+p.day+addDays,12,0,0)-off}
function pad(n){return(n<10?"0":"")+n}
function set(el,v){if(el.textContent!==v){el.textContent=v;if(!reduce){el.classList.remove("tick");void el.offsetWidth;el.classList.add("tick")}}}
function tick(){var now=Date.now(),t=laNoon(now,0),prev=t<=now?t:laNoon(now,-1),next=t>now?t:laNoon(now,1),writing=now-prev<WRITE,f=writing?1:Math.min(1,Math.max(0,(now-prev)/(next-prev)));
 root.classList.toggle("writing",writing);wr.hidden=!writing;tiles.hidden=writing;lab.textContent=writing?"":"Next prime turn in";
 var left=Math.max(0,Math.floor((next-now)/1000));set(eh,pad(Math.floor(left/3600)));set(em,pad(Math.floor(left%3600/60)));set(es,pad(left%60));
 if(h3)h3.style.backgroundPosition=(Math.round(f*20)*5)+"% 0";
 bar.style.width=(f*100).toFixed(2)+"%";pct.textContent=writing?"Today's turn is running: proofs land on the whiteboard in a few minutes":Math.floor(f*100)+"% of the way to tomorrow's turn · noon Pacific";
 root.setAttribute("aria-label",writing?"An agent is proving primes now":"Next prime turn in "+Math.floor(left/3600)+" hours "+Math.floor(left%3600/60)+" minutes")}
tick();setInterval(tick,1000);document.addEventListener("visibilitychange",function(){if(!document.hidden)tick()})})();
