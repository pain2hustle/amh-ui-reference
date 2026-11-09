/* Austin's page controls; Jubber motion is reused from the AMH site. */
(()=>{
if(window.__poemPageControls)return;window.__poemPageControls=true;
const visitorScript=document.createElement('script');visitorScript.src='/poem/assets/visitor-history-v1.js?v=20261018i';document.head.appendChild(visitorScript);
const navRoots='header,nav,#mxmenu,.sp-menu';
document.querySelectorAll(navRoots).forEach(root=>root.querySelectorAll('a').forEach(a=>{
 let u;try{u=new URL(a.href,location.href)}catch{return}
 if(['paycovey.com','www.paycovey.com','austinsaffordablegaragedoor.com','www.austinsaffordablegaragedoor.com'].includes(u.hostname)){a.remove();return}
 if(a.textContent.trim().toLowerCase()==='open the app'){
  if(a.closest('header')&&a.classList.contains('cta')){a.href='/poem/lab/';a.textContent='Lab';a.classList.add('lab-primary');a.title='Superposition Lab'}else a.remove();
 }
}));
const style=document.createElement('style');style.textContent=`
@media(max-width:700px){header .bar>#burger{margin-left:auto}}
header a.lab-primary{background:#a4ff65!important;color:#092100!important;border:1px solid #baff90!important;box-shadow:0 0 16px #8dff5a55;font-weight:800}
#jfab[data-jub]{--jub-pull-x:0px;--jub-pull-y:0px;--jub-near:0;position:fixed!important;touch-action:none;user-select:none;cursor:grab;isolation:isolate;perspective:440px}
#jfab[data-jub] .jubber-ui__motion{position:relative;display:grid;width:100%;height:100%;place-items:center;transform-origin:50% 76%;transform-style:preserve-3d;will-change:transform;pointer-events:none}
#jfab[data-jub] .jubber-ui__glow{position:absolute;z-index:-1;inset:27% 17% 12%;border-radius:50%;background:radial-gradient(ellipse, #c4ff722e,transparent 72%);filter:blur(13px);pointer-events:none}
#jfab[data-jub] .amh-jubber-visual{pointer-events:none;user-select:none;-webkit-user-drag:none;transform-origin:50% 72%}
#jfab[data-jub-dragging]{cursor:grabbing}
#jfab[data-jub-throwing]{pointer-events:none!important}
html.chat-open #jfab[data-jub],html.kb-up #jfab[data-jub]{display:none!important}
@media(prefers-reduced-motion:reduce){#jfab[data-jub] .jubber-ui__motion{animation:none!important}}
`;document.head.appendChild(style);
// Apply the same motion styles to the existing desktop or phone floating control.
const alias=document.createElement('style');alias.textContent=style.textContent.replaceAll('#jfab','.poem-jub-motion');document.head.appendChild(alias);
const fab=document.getElementById(innerWidth>=600?'jubbtn':'jfab');if(!fab)return;
const rect=fab.getBoundingClientRect();fab.classList.add('poem-jub-motion');
fab.style.setProperty('left',rect.left+'px','important');fab.style.setProperty('top',rect.top+'px','important');
fab.style.setProperty('right','auto','important');fab.style.setProperty('bottom','auto','important');fab.style.setProperty('transform','none','important');
const visual=fab.querySelector(':scope>img');if(!visual)return;
visual.classList.add('amh-jubber-visual');visual.draggable=false;
fab.dataset.jub='';fab.title='Tap to chat. Drag and release to fling Jubber.';
const script=document.createElement('script');script.src='/poem/assets/jubber-motion-amh-v5.js?v=20261018c';document.head.appendChild(script);
})();
