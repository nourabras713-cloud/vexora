/* VEXORA game catalogue: only publish games after they are verified. */
(() => {
  const grid=document.getElementById("gameGrid"), empty=document.getElementById("emptyGames"), search=document.getElementById("gameSearch");
  if(!grid||!empty||!search)return;
  let games=[],activeCategory="all";
  const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(){
    const term=search.value.trim().toLowerCase();
    const visible=games.filter(g=>(activeCategory==="all"||String(g.category||"").toLowerCase()===activeCategory)&&[g.title,g.description,g.category].join(" ").toLowerCase().includes(term));
    grid.innerHTML=visible.map(g=>`<article class="game-card">${g.thumbnail?`<img src="${safe(g.thumbnail)}" alt="${safe(g.title)}" loading="lazy">`:""}<div class="game-card-body"><h3>${safe(g.title)}</h3><p>${safe(g.description||"Play this free browser game.")}</p><div class="game-meta"><span>${safe(g.category||"Arcade")}</span><a class="play-link" href="${safe(g.page||g.gameUrl||"#")}" rel="noopener">Play now →</a></div></div></article>`).join("");
    empty.hidden=visible.length>0;
    if(games.length&&!visible.length){empty.hidden=false;empty.querySelector("h3").textContent="No games found";empty.querySelector("p").textContent="Try another title or choose a different category.";}
    else if(!games.length){empty.querySelector("h3").textContent="Games are being prepared";empty.querySelector("p").textContent="Our original collection is being checked before it is added.";}
  }
  search.addEventListener("input",render);
  document.querySelectorAll("[data-filter]").forEach(a=>a.addEventListener("click",()=>{activeCategory=a.dataset.filter||"all";render();}));
  fetch("games/games.json").then(r=>{if(!r.ok)throw Error("Catalogue unavailable");return r.json();}).then(data=>{games=Array.isArray(data)?data:[];render();}).catch(render);
})();