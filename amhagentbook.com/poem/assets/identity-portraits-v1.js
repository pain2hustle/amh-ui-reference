(() => {
  const dialog=document.getElementById("identity-lightbox");
  if(!dialog) return;
  const image=dialog.querySelector(".portrait-full");
  const title=dialog.querySelector("h2");
  const close=dialog.querySelector("[data-portrait-close]");
  let opener=null, previousOverflow="";
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-portrait]");
    if(!button) return;
    opener=button; image.src=button.dataset.portrait;
    image.alt=button.dataset.portraitName+" — full portrait";
    title.textContent=button.dataset.portraitName;
    previousOverflow=document.body.style.overflow;
    dialog.showModal();document.body.style.overflow="hidden";close.focus();
  });
  close.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener("close",()=>{document.body.style.overflow=previousOverflow;image.removeAttribute("src");if(opener?.isConnected)opener.focus();opener=null;});
})();
