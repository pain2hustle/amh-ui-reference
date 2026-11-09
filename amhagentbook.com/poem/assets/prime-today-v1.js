/* Fills any [data-prime-today] card with today's Prime Hunt note (who, emoji, title, result) from daily.json. No note yet = leaves the card as written. */
(function(){var els=document.querySelectorAll("[data-prime-today]");if(!els.length)return;
fetch("/poem/lab/prime-hunt/daily.json",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(j){var d=j&&j.days&&j.days[0];if(!d)return;
var a=d.agent||{},r=d.run||{},n=d.note||{};var who=(a.icon?a.icon+" ":"")+(a.session?a.session+" ("+a.name+")":a.name||"an agent")+(a.brand?" · "+a.brand:"");
var line="Day "+d.day+" · "+who+' · "'+(n.title||"")+'" · '+(r.proven||0)+" proven at 2^"+r.m+(r.largestDigits?" ("+r.largestDigits+" digits)":"")+" · "+(r.composite||0)+" composite";
var tot=j.days.reduce(function(x,y){return x+((y.run||{}).proven||0)},0);
[].forEach.call(els,function(e){var s=e.querySelector("small")||e;s.textContent=line;var em=e.querySelector("em");if(em)em.textContent="Read the whiteboard note →"});
/* team total = daily runs + every prime on the shared list (people's browsers), live */
fetch("https://amh-prime-board.austinsdoors.workers.dev/hunt/primes",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(p){var n=p&&p.primes?p.primes.length:0;if(!n)return;[].forEach.call(els,function(e){var s=e.querySelector("small")||e;s.textContent=(tot+n).toLocaleString()+" primes proven by the team so far ("+n.toLocaleString()+" from people's browsers) · "+line})}).catch(function(){})}).catch(function(){})})();
