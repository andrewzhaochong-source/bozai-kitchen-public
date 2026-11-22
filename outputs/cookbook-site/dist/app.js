let category='全部', query='', current=null, sortOrder='recent', dimension='method';
const $=s=>document.querySelector(s);
function categoryValues(d){return dimension==='cuisine'?[d.cuisine]:dimension==='ingredient'?d.foods:d.tags;}
function availableCategories(){const counts=new Map();for(const d of dishes)for(const c of new Set(categoryValues(d)))counts.set(c,(counts.get(c)||0)+1);const preferred=classification.dimensions[dimension].values;return ['全部',...[...counts.keys()].sort((a,b)=>counts.get(b)-counts.get(a)||(preferred.indexOf(a)<0?999:preferred.indexOf(a))-(preferred.indexOf(b)<0?999:preferred.indexOf(b))||a.localeCompare(b,'zh-CN'))];}
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only actual cooking dates participate; unknown dates sort last.
function latestCookedDate(d){return d.attempts.map(a=>a.cookedAt || '').filter(date=>/^\d{4}-\d{2}-\d{2}(?:$|[ T])/.test(date)).sort().at(-1) || '';}
function compareRecent(a,b){return latestCookedDate(b).localeCompare(latestCookedDate(a)) || a.id-b.id;}
function compareDishes(a,b){return sortOrder==='count' ? b.count-a.count || compareRecent(a,b) : compareRecent(a,b);}
function visibleDishes(){return dishes.filter(d=>(category==='全部'||categoryValues(d).includes(category))&&[d.name,d.cuisine,...d.tags,...d.foods,...(d.flavorTags||[]),d.ingredients,...d.steps].join(' ').includes(query)).sort(compareDishes);}
function render(){
 $('.bottom span:last-child').textContent=`当前收录 ${dishes.length} 道菜 · 点击照片查看做法与复做提醒`;
 const previousScroll=$('.filters').scrollLeft;
 $('.filters').setAttribute('aria-label','按'+classification.dimensions[dimension].label+'筛选');
 $('.filters').innerHTML=availableCategories().map(f=>`<button class="chip ${category===f?'active':''}" aria-pressed="${category===f}" data-filter="${f}">${f}</button>`).join('');
 const list=visibleDishes();
 $('#result').textContent=`${category==='全部'?'全部菜品':category} · ${list.length} 道`;
 $('.filters').scrollLeft=previousScroll;
 $('#open-book').disabled=!list.length;
 $('#grid').innerHTML=list.length?list.map(d=>{
 const ingredients=(d.flavorTags||d.foods).join(' · ');
 const ingredientLabels=(d.flavorTags||d.foods).map(tag=>`<span class="ingredient-tag">${escapeHTML(tag)}</span>`).join('');
 const showBadge=!(dimension==='method'&&category!=='全部'&&d.tags.includes(category));
 return `<button class="card" data-id="${d.id}" aria-label="查看${escapeHTML(d.name)}的做法"><div class="photo"><img loading="lazy" decoding="async" src="${d.cover}" alt="自己做的${escapeHTML(d.name)}">${showBadge?`<span class="badge">${escapeHTML(d.tags[0])}</span>`:''}</div><div class="card-copy"><h2>${escapeHTML(d.name)}</h2><div class="card-ingredients" title="${escapeHTML(ingredients)}">${ingredientLabels}</div><div class="card-footer"><span class="last-cooked">最近 ${latestCookedDate(d)||'日期待补'}</span><span>做过 ${d.count} 次</span></div></div></button>`;
 }).join(''):'<div class="empty">还没有符合条件的菜。换个关键词，或选择「全部」看看。</div>';
}
function closeDimensionMenu(){if($('#dimension-menu').matches(':popover-open'))$('#dimension-menu').hidePopover();}
function openDimensionMenu(button){
 const menu=$('#dimension-menu');
 if(menu.matches(':popover-open')){menu.hidePopover();return;}
 menu.querySelectorAll('[data-dimension]').forEach(item=>item.setAttribute('aria-checked',String(item.dataset.dimension===dimension)));
 const rect=button.getBoundingClientRect();
 menu.style.left=Math.max(12,Math.min(rect.right-168,window.innerWidth-180))+'px';
 menu.style.top=(rect.bottom+190<window.innerHeight?rect.bottom+7:Math.max(12,rect.top-174))+'px';
 menu.showPopover();button.setAttribute('aria-expanded','true');
 menu.querySelector(`[data-dimension="${dimension}"]`).focus({preventScroll:true});
}
$('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){closeDimensionMenu();category=b.dataset.filter;render();$('.filters').querySelector(`[data-filter="${category}"]`).focus({preventScroll:true});}});
$('[data-switch-dimension]').addEventListener('click',e=>openDimensionMenu(e.currentTarget));
$('#dimension-menu').addEventListener('toggle',e=>{const toggle=$('[data-switch-dimension]');if(toggle)toggle.setAttribute('aria-expanded',String(e.newState==='open'));});
$('#dimension-menu').addEventListener('click',e=>{const item=e.target.closest('[data-dimension]');if(!item)return;dimension=item.dataset.dimension;category='全部';closeDimensionMenu();$('.filters').scrollLeft=0;render();});
$('#dimension-menu').addEventListener('keydown',e=>{const buttons=[...$('#dimension-menu').querySelectorAll('[data-dimension]')];const index=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}if(e.key==='Escape'){e.preventDefault();closeDimensionMenu();$('[data-switch-dimension]').focus({preventScroll:true});}});
window.addEventListener('resize',closeDimensionMenu);
function closeSortMenu(){if($('#sort-menu').matches(':popover-open'))$('#sort-menu').hidePopover();}
$('#sort').addEventListener('click',()=>{
 const menu=$('#sort-menu');if(menu.matches(':popover-open')){menu.hidePopover();return;}
 closeDimensionMenu();
 const rect=$('#sort').getBoundingClientRect();
 menu.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-196))+'px';
 menu.style.top=(rect.bottom+150<window.innerHeight?rect.bottom+6:Math.max(12,rect.top-144))+'px';
 menu.querySelectorAll('[data-sort]').forEach(item=>item.setAttribute('aria-checked',String(item.dataset.sort===sortOrder)));
 menu.showPopover();menu.querySelector(`[data-sort="${sortOrder}"]`).focus({preventScroll:true});
});
$('#sort-menu').addEventListener('toggle',e=>$('#sort').setAttribute('aria-expanded',String(e.newState==='open')));
$('#sort-menu').addEventListener('click',e=>{const item=e.target.closest('[data-sort]');if(!item)return;sortOrder=item.dataset.sort;const text=item.textContent;$('#sort-label').textContent=text;$('#sort').setAttribute('aria-label','排序：'+text);closeSortMenu();render();$('#sort').focus({preventScroll:true});});
$('#sort-menu').addEventListener('keydown',e=>{const buttons=[...$('#sort-menu').querySelectorAll('[data-sort]')];const index=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}if(e.key==='Escape'){e.preventDefault();closeSortMenu();$('#sort').focus({preventScroll:true});}});
window.addEventListener('resize',closeSortMenu);
let searchExpanded=false,searchRevealFrame=0;
function revealSearchDuringExpansion(start){
 const toolbar=$('.toolbar'),control=$('.search-control');
 const bounds=toolbar.getBoundingClientRect(),rect=control.getBoundingClientRect();
 if(rect.right>bounds.right-2)toolbar.scrollLeft+=rect.right-bounds.right+2;
 if(searchExpanded&&performance.now()-start<380)searchRevealFrame=requestAnimationFrame(()=>revealSearchDuringExpansion(start));
 else searchRevealFrame=0;
}
function setSearchOpen(open){
 if(searchExpanded===open)return;
 searchExpanded=open;
 const toggle=$('#search-toggle'),panel=$('#search-panel'),control=$('.search-control');
 toggle.setAttribute('aria-expanded',String(open));control.classList.toggle('is-expanded',open);
 if(!open&&panel.contains(document.activeElement))toggle.focus({preventScroll:true});
 panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
 if(searchRevealFrame){cancelAnimationFrame(searchRevealFrame);searchRevealFrame=0;}
 if(open){
  closeDimensionMenu();closeSortMenu();$('#search').focus({preventScroll:true});
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){const start=performance.now();searchRevealFrame=requestAnimationFrame(()=>revealSearchDuringExpansion(start));}
  else revealSearchDuringExpansion(performance.now()-400);
 }
}
// Keep the input focused until a click on its icon has toggled the open state.
$('#search-toggle').addEventListener('pointerdown',e=>{if(searchExpanded&&document.activeElement===$('#search'))e.preventDefault();});
$('#search-toggle').addEventListener('click',()=>setSearchOpen(!searchExpanded));
$('#search').addEventListener('blur',()=>setSearchOpen(false));
$('#search').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setSearchOpen(false);$('#search-toggle').focus({preventScroll:true});}});
$('#search').addEventListener('input',e=>{query=e.target.value.trim();$('#search-toggle').classList.toggle('has-query',!!query);$('#search-toggle').setAttribute('aria-label',query?'搜索，当前关键词：'+query:'搜索菜名或食材');render();});

function showAttempt(d,key,scope=document,preview=false){
 const $=selector=>scope.querySelector(selector);
 const paper=scope.querySelector(".detail-paper");if(paper&&!preview)paper.scrollTop=0;
 const attempt=d.attempts.find(a=>a.key===key);
 if(!preview)current={...d,...attempt};
 $('#detail-name').textContent=d.name;
 $('#detail-img').src=attempt.photo;
 $('#detail-img').alt=d.name+'成品照片';
 $('#detail-meta').textContent=`${d.cuisine} · ${d.tags.join(' · ')} · 做菜日期：${attempt.cookedAt || '待补'}`;
 $('#attempt-count').textContent=`已记录 ${d.count} 次`;
 const ordered=[...d.attempts].sort((a,b)=>a.cookedAt&&b.cookedAt?a.cookedAt.localeCompare(b.cookedAt):a.cookedAt?-1:b.cookedAt?1:a.key.localeCompare(b.key));
 $('#timeline').innerHTML=ordered.map((a,index)=>`<li><button data-attempt="${escapeHTML(a.key)}" aria-pressed="${a.key===key}">${a.cookedAt ? `记录 ${index+1}` : '日期待补记录'}<span class="date">${escapeHTML(a.cookedAt || '日期待补')}</span></button></li>`).join('');
 $('#ingredients').textContent=attempt.ingredients.replace(/^- /gm,'');
 $('#steps').innerHTML=attempt.steps.length?attempt.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join(''):'<p class="ingredients">这次先记下搭配，烹饪步骤尚未记录。</p>';
 $('#tips').innerHTML=d.tips.map(s=>`<p>${escapeHTML(s)}</p>`).join('');
 $('#note').textContent=attempt.note==='未记录。'?'还没有留下评价。':attempt.note;
 $('#note').classList.toggle('personal-note',!!attempt.note&&attempt.note!=='未记录。');
 $('#source').textContent=attempt.source;$('#source').hidden=true;
 $('#source-toggle').setAttribute('aria-expanded','false');$('#source-toggle').textContent='查看原始口述';
}
let detailSource=null,detailMotion=null,detailClosing=false;
function resetDetailScroll(){const dialog=$('#detail');dialog.scrollTop=0;dialog.querySelector('.detail-paper').scrollTop=0;}
function openDishDetail(d,source=null){
 const dialog=$('#detail');if(dialog.open||detailClosing)return;
 const attempt=d.attempts.find(a=>a.cookedAt===latestCookedDate(d))||d.attempts.at(-1);
 showAttempt(d,attempt.key);detailSource=source;
 const from=source?.getBoundingClientRect();
 if(source){source.style.visibility='hidden';source.inert=true;}
 dialog.classList.toggle('recipe-note',$('#book-dialog').open);
 dialog.showModal();dialog.focus({preventScroll:true});resetDetailScroll();
 if(from){const to=dialog.getBoundingClientRect();
  const transform=`translate(${from.left+from.width/2-to.left-to.width/2}px,${from.top+from.height/2-to.top-to.height/2}px) scale(${from.width/to.width},${from.height/to.height}) rotate(-1deg)`;
  detailMotion=dialog.animate([{transform},{transform:'rotate(-.65deg)'}],{duration:matchMedia('(prefers-reduced-motion:reduce)').matches?1:620,easing:'cubic-bezier(.22,.75,.25,1)',fill:'none'});
  detailMotion.finished.catch(()=>{}).finally(()=>{detailMotion=null;});
 }
 requestAnimationFrame(resetDetailScroll);
}
async function closeDishDetail(){
 const dialog=$('#detail');if(!dialog.open||detailClosing)return;detailClosing=true;
 if(detailMotion){detailMotion.cancel();detailMotion=null;}
 if(detailSource?.isConnected){
  const from=dialog.getBoundingClientRect(),to=detailSource.getBoundingClientRect();
  const transform=`translate(${to.left+to.width/2-from.left-from.width/2}px,${to.top+to.height/2-from.top-from.height/2}px) scale(${to.width/from.width},${to.height/from.height}) rotate(-1deg)`;
  const animation=dialog.animate([{transform:'rotate(-.65deg)'},{transform}],{duration:matchMedia('(prefers-reduced-motion:reduce)').matches?1:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  try{await animation.finished;}catch{}dialog.close();animation.cancel();
 }else dialog.close();
 detailClosing=false;
}
$('#grid').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)openDishDetail(dishes.find(d=>d.id===Number(b.dataset.id)));});
$('#timeline').addEventListener('click',e=>{const b=e.target.closest('[data-attempt]');if(b&&current)showAttempt(dishes.find(d=>d.id===current.id),b.dataset.attempt);});
$('#detail').addEventListener('cancel',e=>{e.preventDefault();closeDishDetail();});
$('#detail').addEventListener('close',()=>{if(detailSource){detailSource.style.visibility='';detailSource.inert=false;if(detailSource.isConnected)detailSource.focus({preventScroll:true});}detailSource=null;$('#detail').classList.remove('recipe-note');resetDetailScroll();});
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDishDetail();}});
$('#view-photo').addEventListener('click',()=>{
 if(!current)return;
 const viewer=$('#photo-viewer'),img=$('#full-photo');img.src=current.photo;img.alt=current.name+'完整照片';viewer.showModal();viewer.focus({preventScroll:true});
});
$('#photo-viewer').addEventListener('click',()=>$('#photo-viewer').close());
$('#photo-viewer').addEventListener('close',()=>{if($('#detail').open)$('#view-photo').focus({preventScroll:true});});
$('#source-toggle').addEventListener('click',()=>{const el=$('#source');el.hidden=!el.hidden;$('#source-toggle').setAttribute('aria-expanded',String(!el.hidden));$('#source-toggle').textContent=el.hidden?'查看原始口述':'收起原始口述';});
$('#download').addEventListener('click',()=>{if(!current)return;const url=URL.createObjectURL(new Blob([current.record],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=current.name+'-本次做法.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();

// Adapted from Amicro DitherBook.tsx (SPDX-License-Identifier: Apache-2.0).
// Preserve its two-sided leaves, directional base pages and crease lighting.
let bookDishes=[],bookCategories=[],bookPage=0,bookBusy=false,bookAnimation=null,bookOpened=false;
let bookTurnQueue=[],bookTurnRunning=false,bookTurnTarget=null,bookTurnEpoch=0;
const bookSpreadReadiness=new WeakMap();
function intendedBookPage(){return bookTurnQueue.at(-1)?.target??bookTurnTarget??(bookOpened?bookPage:-1);}
function cancelBookNavigation(){
 bookTurnEpoch++;
 for(const job of bookTurnQueue)job.resolve(false);
 bookTurnQueue=[];
 if(bookAnimation)bookAnimation.cancel();bookAnimation=null;
 bookTurnRunning=false;bookTurnTarget=null;bookBusy=false;
 const root=$('#recipe-book');root.classList.remove('opening','closing');
 root.querySelectorAll('.book-leaf,.book-turn-shadow').forEach(el=>el.remove());
}
const bookMobile=()=>window.matchMedia('(max-width:900px)').matches;
const bookSize=()=>previousBookMobile?1:2;
let bookSheets=[];
const bookTotal=()=>Math.ceil(bookSheets.length/bookSize());
function groupBookDishes(list){
 const groups=new Map();for(const d of list){const method=d.tags[0]||'其他';if(!groups.has(method))groups.set(method,[]);groups.get(method).push(d);}
 const order=classification.dimensions.method.values;
 return [...groups].sort((a,b)=>{const ai=order.indexOf(a[0]),bi=order.indexOf(b[0]);return b[1].length-a[1].length||(ai<0?999:ai)-(bi<0?999:bi);}).map(([name,items])=>({name,items}));
}
const chapterNotes={
 '炒菜':'锅气一响，米饭遭殃。',
 '蒸菜':'盖上锅盖，把鲜嫩留住。',
 '汤类':'一勺热汤，慢慢喝暖。',
 '砂锅菜':'咕嘟一锅，香到最后一口。',
 '火锅':'围着热气，把日子涮香。',
 '白灼':'清水一滚，鲜味就到。',
 '烤物':'烤到焦香，才算好时光。',
 '凉菜':'拌一盘清爽，等一阵晚风。',
 '焖饭':'揭开锅盖，饭香先开席。',
 '煮面':'挑起一筷，都是好滋味。'
};
const flourish=`<svg class="editorial-flourish" viewBox="0 0 400 150" fill="none" aria-hidden="true"><path d="M15 130C85 92 70 0 105 30S150 130 185 70 220 55 250 120M210 120C280 45 340 120 390 75" stroke="#7c8990" stroke-width="1.4"/><path d="M0 140C70 65 130 155 205 113" stroke="#d3c9b6"/></svg>`;
function kitchenDrawing(method){
 const palette={炒菜:['#dddcc9','#6a7954'],蒸菜:['#eadbc3','#a77845'],汤类:['#dce2d9','#688578'],砂锅菜:['#e9d7cb','#9d6548'],火锅:['#ecd6ca','#b75e46'],白灼:['#e4ded1','#8e9c86'],烤物:['#e8d8c6','#996b45'],凉菜:['#dce2d0','#778959'],焖饭:['#e7ddbb','#b18c43'],煮面:['#e5dacd','#a06e53']};
 const [wash,accent]=palette[method]||palette['汤类'];
 const leaf=(x,y,rot=0)=>`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0Q-21-27 0-44Q21-27 0 0" fill="#70855b"/><path d="M0-4v-32" stroke="#b4c49b" stroke-width="1.4"/></g>`;
 const mushroom=(x,y,rot=0)=>`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-5-2h10v19q-5 5-10 0" fill="#e5cba6"/><path d="M-22 0q2-31 22-31Q20-31 22 0z" fill="#8e6551"/><path d="M-8-17l16 8m-16 0l16-8" stroke="#dbc4a3" stroke-width="2"/></g>`;
 const shrimp=(x,y,rot=0)=>`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M15-16C-25-33-36 23-3 30Q14 34 20 18" fill="none" stroke="#cb805f" stroke-width="16"/><path d="M-16-13l9 10m-18 3l13 3m-12 12l12-3M13 16l15-9-1 17z" fill="#df9d75" stroke="#f1c39d" stroke-width="2"/><circle cx="15" cy="-16" r="2" fill="#574639"/></g>`;
 const steam='<g fill="none" stroke="#a99e8b" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M136 112c-20-21 17-30 0-54M179 99c-15-18 14-28 2-47M220 112c-18-18 18-34 2-48"/></g>';
 const herbs=leaf(110,182,-65)+leaf(244,173,45)+mushroom(195,181,-20);
 let scene='';
 if(method==='火锅')scene=`<path d="M64 182H43v35h27m222-35h25v35h-27" fill="none" stroke="#886247" stroke-width="11"/><path d="M68 184h224l-12 64q-96 51-200 0z" fill="#aa7951"/><ellipse cx="180" cy="184" rx="114" ry="65" fill="#d4ac70"/><ellipse cx="180" cy="182" rx="102" ry="55" fill="#f2d9a1"/><path d="M180 127c70 0 104 24 104 55s-40 55-104 55c46-45-46-65 0-110" fill="#b75a3c"/><path d="M180 127c-47 45 47 65 0 110" fill="none" stroke="#dfbb7a" stroke-width="6"/>${mushroom(131,176,-35)}${leaf(123,215,55)}${shrimp(227,176,30)}<g fill="#ebad69"><circle cx="225" cy="210" r="7"/><circle cx="237" cy="147" r="5"/><circle cx="205" cy="143" r="4"/></g><path d="M203 200q20-25 32-5M204 165q9-19 20-12" stroke="#782f23" stroke-width="6" fill="none"/>`;
 else if(method==='蒸菜')scene=`<path d="M72 156h216v92q-108 56-216 0z" fill="#ba8d55"/><path d="M72 187q108 51 216 0M72 226q108 51 216 0" stroke="#e6c697" stroke-width="6" fill="none"/><g stroke="#8e693e" opacity=".45">${Array.from({length:15},(_,i)=>`<path d="M${80+i*14} 184v61"/>`).join('')}</g><ellipse cx="180" cy="155" rx="108" ry="52" fill="#e3c396"/><ellipse cx="180" cy="155" rx="95" ry="41" fill="#c09a69"/><g fill="#f1e5ce" stroke="#d3bc98" stroke-width="1.5">${[[131,143],[204,139],[166,175],[235,171]].map(([x,y])=>`<path d="M${x-27} ${y+10}q0-45 30-36q31 10 24 31q-20 18-54 5z"/><path d="M${x} ${y-24}l-5 23m9-22l6 21m-2-19l15 16" fill="none"/>`).join('')}</g>${steam}`;
 else if(method==='炒菜')scene=`<path d="M262 169l62-37" stroke="#9b7556" stroke-width="18" stroke-linecap="round"/><path d="M79 181q101 168 201 0z" fill="#495453"/><ellipse cx="180" cy="180" rx="101" ry="49" fill="#67736d"/><ellipse cx="180" cy="178" rx="89" ry="39" fill="#394943"/>${herbs}<path d="M124 168l32 17m31-33l27 23m-46 23l32-6" stroke="#cf9c72" stroke-width="11" stroke-linecap="round"/><path d="M141 129q-12-19-2-26m71 21l9-21" stroke="#af5a40" stroke-width="7" stroke-linecap="round"/><path d="M97 140L60 89" stroke="#aa805b" stroke-width="6"/><path d="M91 131l21-5 22 30-24 12z" fill="#c49b6c"/>`;
 else if(method==='砂锅菜')scene=`<path d="M90 172l-30 5v28l27 5m183-38l30 5v28l-27 5" stroke="#6e4d3a" stroke-width="13" fill="none"/><path d="M85 172h190l-9 75q-86 47-172 0z" fill="#875b40"/><ellipse cx="180" cy="173" rx="95" ry="44" fill="#b38256"/><ellipse cx="180" cy="173" rx="83" ry="33" fill="#4b3b2b"/>${herbs}<g fill="#c49b69"><path d="M135 159l29-8 12 25-33 10z"/><path d="M214 185l27-9 12 19-31 9z"/></g>${steam}`;
 else if(method==='烤物')scene=`<path d="M66 139l231 0-15 120H77z" fill="#7b7a6a"/><path d="M79 150h204l-12 95H89z" fill="#c2b7a0"/><g stroke="#817d69" stroke-width="2">${Array.from({length:7},(_,i)=>`<path d="M${99+i*25} 152l-6 91"/>`).join('')}</g><g fill="#a86943" stroke="#d4a06c" stroke-width="4"><rect x="104" y="164" width="37" height="64" rx="14" transform="rotate(-16 120 195)"/><rect x="153" y="159" width="37" height="64" rx="14" transform="rotate(-16 170 195)"/><rect x="204" y="156" width="37" height="64" rx="14" transform="rotate(-16 220 190)"/></g><path d="M108 178l18-6m-13 22l18-6m-12 22l18-6m24-29l18-6m-13 22l18-6m33-14l18-6m-13 22l18-6" stroke="#73442e" stroke-width="3"/>${leaf(267,233,32)}`;
 else if(method==='白灼'||method==='凉菜')scene=`<ellipse cx="180" cy="207" rx="127" ry="68" fill="#b6b7a2"/><ellipse cx="180" cy="199" rx="126" ry="68" fill="#eee9da"/><ellipse cx="180" cy="199" rx="108" ry="53" fill="none" stroke="#8b9c94" stroke-width="2"/>${method==='白灼'?shrimp(125,185,-50)+shrimp(172,180,-20)+shrimp(218,189,20)+leaf(226,231,70):leaf(120,217,-55)+leaf(153,231,-20)+leaf(200,223,20)+leaf(230,207,60)+'<path d="M123 187l90 24m-65-44l61 27m-74 21l81-43" stroke="#e3bb91" stroke-width="9" stroke-linecap="round"/><g fill="#ac6345"><circle cx="152" cy="191" r="4"/><circle cx="198" cy="202" r="4"/><circle cx="178" cy="173" r="4"/></g>'}`;
 else {const rice=method==='焖饭',noodle=method==='煮面';scene=`<path d="M74 171q14 112 106 113q92-1 106-113" fill="${rice?'#ac8150':noodle?'#b17257':'#78958d'}"/><ellipse cx="180" cy="171" rx="106" ry="48" fill="#ede4cd"/><ellipse cx="180" cy="171" rx="94" ry="37" fill="${rice?'#e3c88c':noodle?'#d9b66e':'#d6b47b'}"/>${rice?'<g stroke="#f7e5b1" stroke-width="3" stroke-linecap="round">'+Array.from({length:36},(_,i)=>`<path d="M${105+(i%9)*18} ${151+Math.floor(i/9)*12}l5 3"/>`).join('')+'</g><path d="M118 162l30 5m45-10l31 13m-63 21l27-4" stroke="#a6744e" stroke-width="13"/>':noodle?'<g fill="none" stroke="#f3d99b" stroke-width="4"><path d="M108 170q20-35 40 0t40 0t40 0t25 0M111 183q20-35 40 0t40 0t40 0M120 154q20 30 40 0t40 0t40 0"/></g><path d="M220 159L290 66m-57 100L305 70" stroke="#805f44" stroke-width="5"/>':mushroom(145,174,-20)+'<path d="M192 163l27-5 11 21-29 7z" fill="#e9d4ad"/>'}${leaf(249,181,42)}${steam}`;}
 return `<svg class="kitchen-drawing culinary-art" viewBox="0 0 360 340" aria-hidden="true"><circle cx="180" cy="170" r="139" fill="${wash}" opacity=".58"/><circle cx="180" cy="170" r="148" fill="none" stroke="${accent}" stroke-width=".6" opacity=".22" stroke-dasharray="2 6"/><ellipse cx="182" cy="286" rx="106" ry="10" fill="#7f6c53" opacity=".10"/>${scene}<path d="M51 269q-20-37-6-63m-1 33q-20-8-19-23m19 12q17-10 15-25" fill="none" stroke="${accent}" stroke-width="1.4" opacity=".7"/><circle cx="299" cy="111" r="3" fill="${accent}" opacity=".4"/><circle cx="311" cy="124" r="1.5" fill="${accent}" opacity=".4"/></svg>`;
}
function recommendationHTML(d){
 const attempt=d.attempts.find(a=>a.cookedAt===latestCookedDate(d))||d.attempts.at(-1);
 const paper=$('#detail .detail-paper').cloneNode(true);
 showAttempt(d,attempt.key,paper,true);
 paper.querySelectorAll('.close,.timeline-section,.detail-actions,.source').forEach(el=>el.remove());
 const photoButton=paper.querySelector('.view-photo');if(photoButton)photoButton.replaceWith(photoButton.querySelector('img'));
 paper.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));

 return `<h2 class="recommendation-title">主厨推荐<svg class="chef-hat" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 24c-11-1-9-17 1-16c3-9 16-9 19 0c11-1 13 15 1 16v10H10zM10 28h21M17 23v-6m7 6v-6"/></svg></h2><article class="book-recommendation-note" tabindex="0" role="button" data-book-dish="${d.id}" aria-label="主厨推荐：${escapeHTML(d.name)}，点击查看完整做法">${paper.outerHTML}</article>`;
}
function prepareBookSheets(){
 bookSheets=[{type:'toc',half:0},{type:'toc',half:1}];
 bookCategories.forEach((g,n)=>{
  g.page=bookSheets.length;
  bookSheets.push({type:'chapter',g,n});
  for(let offset=0;offset<g.items.length;offset+=5)bookSheets.push({type:'menu',g,n,items:g.items.slice(offset,offset+5),offset});
  // The next category always begins on a left page. Keep recommendations stable for this book session.
  if(bookSheets.length%2){const d=g.items[Math.floor(Math.random()*g.items.length)];bookSheets.push({type:'recommendation',g,n,d});}
 });
}
function bookPageHTML(index,side){
 const page=bookSheets[index];if(!page)return `<section class="book-page book-${side} book-end">好菜，慢慢记。</section>`;
 const {type,g,n,d}=page;let content='';
 if(type==='welcome')content=`<div class="editorial-welcome"><span class="editorial-kicker">家常有味 / 四季三餐</span><h2>一餐一饭，<br>都是日常。</h2><p>做过的好菜，慢慢记下来。</p><p>${bookDishes.length} 道菜 · ${bookCategories.length} 种做法</p>${flourish}</div>`;
 if(type==='toc'){const split=Math.ceil(bookCategories.length/2),start=page.half?split:0;content=`<div class="toc-heading">${page.half?'<span class="toc-continuation">寻味 · 续篇</span>':'<span class="toc-eyebrow">四季三餐 / 私房手记</span><h2 class="editorial-title">目录<span>CONTENTS</span></h2>'}</div><div class="editorial-toc">${bookCategories.slice(start,page.half?undefined:split).map((c,i)=>`<button data-book-page="${c.page}"><span>${String(start+i+1).padStart(2,'0')}</span><strong>${escapeHTML(c.name)}</strong><small>${c.items.length} 道</small><span>${String(c.page+1).padStart(2,'0')} ↗</span></button>`).join('')}</div><div class="toc-bottom"><span>一餐一饭，皆是日常。</span><i>✦</i></div>`;}
 if(type==='intro')content=`<div class="contents-art"><span class="editorial-kicker">THE WEEKEND KITCHEN</span>${kitchenDrawing('炒菜')}<p>一餐一饭，慢慢记。</p><span class="contents-stamp">家常有味</span></div>`;
 if(type==='chapter')content=`<div class="editorial-chapter illustrated-chapter"><span class="chapter-number">${String(n+1).padStart(2,'0')} / 私房手记</span><h2>${escapeHTML(g.name)}</h2>${kitchenDrawing(g.name)}<p>${chapterNotes[g.name]||'好好下厨，好好吃饭。'}</p></div>`;
 if(type==='recommendation')content=recommendationHTML(d);
 if(type==='menu')content=`<div class="book-menu-list">${page.items.map((dish,i)=>`<button class="book-menu-item" data-book-dish="${dish.id}"><span class="book-item-number">${String(i+1+page.offset).padStart(2,'0')}</span><span class="book-item-copy"><strong>${escapeHTML(dish.name)}</strong><span>${escapeHTML(dish.foods.join(' · '))}</span></span><img src="${dish.image||dish.cover}" alt="${escapeHTML(dish.name)}"><span class="book-item-arrow">↗</span></button>`).join('')}</div>${flourish}`;
 if(d){const attempt=d.attempts.find(a=>a.cookedAt===latestCookedDate(d))||d.attempts.at(-1);
 if(type==='photo')content=`<div class="editorial-recipe-heading"><h2>${escapeHTML(d.name)}</h2><p>${escapeHTML(d.summary||d.tips[0])}</p></div><img class="editorial-dish-photo" src="${d.image||d.cover}" alt="${escapeHTML(d.name)}"><div class="editorial-facts"><span>做菜日期<strong>${latestCookedDate(d)||'待补'}</strong></span><span>${escapeHTML(d.label)}<strong>${escapeHTML(d.time)}</strong></span><span>做菜记录<strong>${d.count} 次</strong></span></div><p class="editorial-note">${escapeHTML(d.tips[0])}</p>${flourish}`;
 if(type==='recipe')content=`<div class="editorial-recipe-scroll" tabindex="0"><h2 class="paper-section">食材</h2><div class="paper-ingredients">${escapeHTML(attempt.ingredients.replace(/^- /gm,''))}</div><h2 class="paper-section">步骤</h2><ol class="paper-steps">${attempt.steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol><h2 class="paper-section">下次记住</h2><p class="paper-tip">${escapeHTML(d.tips.join('；'))}</p><button class="paper-link" data-book-record="${d.id}">查看时间轴与完整记录 ↗</button></div>`;
 }
 return `<section class="book-page book-${side} editorial-page type-${type}"><div class="book-page-head"><span>波仔厨房 · 私房菜谱</span><span>${['menu','recommendation'].includes(type)?'':g?escapeHTML(g.name):'家常有味'}</span></div><div class="editorial-content">${content}</div><div class="book-page-foot"><button class="paper-link" data-book-page="${0}">${'总目录'}</button><span>${String(index+1).padStart(2,'0')}</span></div></section>`;
}
function bookCoverHTML(){return `<button class="book-cover reference-cover" id="book-cover" aria-label="翻开波仔厨房菜谱书"><img src="assets/book-cover.png" alt="波仔厨房，做过的好菜，慢慢记下来"><span class="reference-open">轻点翻开 ↗</span></button>`;}
async function openBookCover(fromQueue=false){
 if(bookOpened||(bookBusy&&!fromQueue))return false;bookBusy=true;const epoch=bookTurnEpoch;
 const root=$('#recipe-book'),cover=root.querySelector('.bound-cover');
 await readyBookSpread(ensureBookSpread(bookPage));
 if(epoch!==bookTurnEpoch)return false;
 if(!$('#book-dialog').open){bookBusy=false;return false;}
 root.classList.add('opening');root.classList.remove('is-closed');
 const rotation=previousBookMobile?'rotateX':'rotateY',angle=previousBookMobile?180:-180;
 bookAnimation=cover.animate([{transform:`${rotation}(0deg)`},{transform:`${rotation}(${angle}deg)`}],{duration:window.matchMedia('(prefers-reduced-motion:reduce)').matches?1:1150,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
 try{await bookAnimation.finished;}catch(e){if(epoch===bookTurnEpoch){bookBusy=fromQueue;root.classList.remove('opening');}return false;}
 if(epoch!==bookTurnEpoch)return false;
 bookOpened=true;bookBusy=fromQueue;bookAnimation=null;root.classList.remove('opening');cover.hidden=true;renderBook();$('#book-menu-focus').focus({preventScroll:true});return true;
}
function bookSpread(page){const n=page*bookSize();return previousBookMobile?bookPageHTML(n,'right'):bookPageHTML(n,'left')+bookPageHTML(n+1,'right');}
function updateBookControls(){
 const destination=intendedBookPage(),coverBusy=bookBusy&&!bookTurnRunning;
 $('#book-prev').disabled=coverBusy||destination<0;
 $('#book-next').disabled=coverBusy||destination>=bookTotal()-1;
 $('#book-prev').textContent=previousBookMobile?'上一页':'← 上一页';
 $('#book-next').textContent=previousBookMobile?'下一页':'下一页 →';
 const first=bookPage*bookSize()+1,last=Math.min((bookPage+1)*bookSize(),bookSheets.length);
 $('#book-position').textContent=bookOpened?`${first===last?first:first+'—'+last} / ${bookSheets.length} 页`:'';
}
function ensureBookSpread(index){
 const root=$('#recipe-book');let spread=root.querySelector(`[data-spread="${index}"]`);
 if(!spread&&index>=0&&index<bookTotal()){
  spread=document.createElement('div');spread.className='bound-spread';spread.dataset.spread=index;spread.style.visibility='hidden';spread.inert=true;spread.innerHTML=bookSpread(index);root.prepend(spread);
 }
 return spread;
}
function readyBookSpread(spread){
 if(!spread)return Promise.resolve();
 if(!bookSpreadReadiness.has(spread))bookSpreadReadiness.set(spread,Promise.all([...spread.querySelectorAll('img')].map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve())));
 return bookSpreadReadiness.get(spread);
}
function mountBook(){
 const root=$('#recipe-book');
 root.innerHTML=`<div class="bound-cover"><div class="cover-front">${bookCoverHTML()}</div><div class="cover-back">${bookPageHTML(0,'left')}</div></div>`;
 renderBook();
}
function renderBook(){
 const root=$('#recipe-book');
 for(const n of [bookPage-2,bookPage-1,bookPage,bookPage+1,bookPage+2]){const spread=ensureBookSpread(n);if(spread)readyBookSpread(spread);}
 root.querySelectorAll('[data-spread]').forEach(el=>{if(Math.abs(Number(el.dataset.spread)-bookPage)>2)el.remove();});
 root.classList.toggle('is-closed',!bookOpened);
 root.querySelectorAll('[data-spread]').forEach(el=>{const active=Number(el.dataset.spread)===bookPage;el.style.visibility=active?'visible':'hidden';el.inert=!active||!bookOpened;});
 const cover=root.querySelector('.bound-cover');if(cover){cover.hidden=bookOpened;if(!bookOpened)cover.getAnimations().forEach(a=>a.cancel());}
 for(const el of [$('.book-controls'),$('#book-menu-focus')]){el.hidden=false;el.style.visibility=bookOpened?'visible':'hidden';el.inert=!bookOpened;el.setAttribute('aria-hidden',String(!bookOpened));}
 $('.book-help').textContent=bookOpened?(previousBookMobile?'上半页空白返回 · 下半页空白继续 · 上下滑动翻页':'点击书页左右空白翻页 · 点击菜名查看做法 · 按 Esc 关闭'):'轻点封面，翻开你的私房菜谱';updateBookControls();
}
function makePaperTurn(frontSource,backSource,dir,vertical,duration){
 const root=$('#recipe-book'),leaf=document.createElement('div');
 leaf.className='book-leaf soft-paper-leaf'+(vertical?' is-vertical':'');leaf.inert=true;leaf.setAttribute('aria-hidden','true');root.append(leaf);
 const width=leaf.clientWidth,height=leaf.clientHeight,count=24,length=vertical?height:width,step=length/count;
 const frames=Array.from({length:count},()=>[]),lights=Array.from({length:count},()=>[]);
 for(let k=0;k<=32;k++){
  const time=k/32,eased=time*time*(3-2*time),q=dir>0?eased:1-eased;
  const base=-Math.PI*q,bend=Math.sin(Math.PI*q)*1.12,lift=Math.sin(Math.PI*q)*14;
  // The first strip stays on the binding; the free edge does all the moving.
  let along=0,z=0,sag=0;
  for(let i=0;i<count;i++){
   const u=(i+.5)/count,angle=base+bend*(u-.32),slope=-2*lift*u/length;
   const x=vertical?sag:along,y=vertical?along:sag,rotation=vertical?-angle:angle;
   frames[i].push({offset:time,transform:`translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${(z+.4).toFixed(3)}px) rotate${vertical?'X':'Y'}(${rotation*180/Math.PI}deg) skew${vertical?'X':'Y'}(${Math.atan(slope)*180/Math.PI}deg)`});
   lights[i].push({offset:time,opacity:Math.sin(Math.PI*q)*(.035+.16*Math.abs(u-.38))});
   along+=Math.cos(angle)*step;z-=Math.sin(angle)*step;sag+=slope*step;
  }
 }
 const animations=[],timing={duration,easing:'linear',fill:'both'};
 const cloneFace=(source,offset,back)=>{
  const face=document.createElement('div');face.className='paper-face '+(back?'paper-back':'paper-front');
  const page=source.cloneNode(true);page.style.cssText+=`;left:${vertical?0:offset}px;top:${vertical?offset:0}px;width:${width}px;height:${height}px;visibility:visible`;
  face.append(page);const shade=document.createElement('span');shade.className='paper-light';face.append(shade);return {face,shade};
 };
 for(let i=0;i<count;i++){
  const strip=document.createElement('div');strip.className='paper-strip';strip.style.width=(vertical?width:step+.55)+'px';strip.style.height=(vertical?step+.55:height)+'px';
  const front=cloneFace(frontSource,-i*step,false),back=cloneFace(backSource,-(length-(i+1)*step),true);
  strip.append(front.face,back.face);leaf.append(strip);
  animations.push(strip.animate(frames[i],timing),front.shade.animate(lights[i],timing),back.shade.animate(lights[i],timing));
 }
 const shadow=document.createElement('div');shadow.className='book-turn-shadow'+(vertical?' is-vertical':'');root.append(shadow);
 animations.push(shadow.animate([{opacity:0},{opacity:.2,offset:.42},{opacity:.12,offset:.72},{opacity:0}],timing));
 const clock=animations[0];
 return {leaf,finished:clock.finished,
  setSpeed(rate){animations.forEach(a=>a.updatePlaybackRate(rate));},
  cancel(){animations.forEach(a=>a.cancel());leaf.remove();shadow.remove();},
  finish(){animations.forEach(a=>a.finish());},
  pause(){animations.forEach(a=>a.pause());},
  get currentTime(){return clock.currentTime;},set currentTime(t){animations.forEach(a=>a.currentTime=t);},
  dispose(){animations.forEach(a=>a.cancel());leaf.remove();shadow.remove();}
 };
}
async function performBookTurn(target,epoch){
 const dir=target>bookPage?1:-1,root=$('#recipe-book');
 const old=ensureBookSpread(bookPage),next=ensureBookSpread(target),mobile=previousBookMobile;
 await readyBookSpread(next);
 if(epoch!==bookTurnEpoch||!$('#book-dialog').open)return false;
 const front=(dir>0?old:next).querySelector('.book-right');
 const back=(dir>0?next:old).querySelector(mobile?'.book-right':'.book-left');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const turn=makePaperTurn(front,back,dir,mobile,reduced?1:bookTurnQueue.length?460:680);
 bookAnimation=turn;
 // A returning sheet lands over the current page. Keep the destination hidden
 // underneath it until landing; coplanar 3D spreads cannot rely on z-index alone.
 next.style.visibility=mobile&&dir<0?'hidden':'visible';old.style.zIndex=dir>0?'2':'1';next.style.zIndex=dir>0?'1':'2';
 if(mobile){if(dir>0)old.style.visibility='hidden';}
 else (dir>0?old:next).querySelector('.book-right').style.visibility='hidden';
 let completed=false;
 try{await turn.finished;if(epoch===bookTurnEpoch){bookPage=target;completed=true;}}
 catch{}finally{
  old.style.zIndex='';next.style.zIndex='';
  old.querySelector('.book-right').style.visibility='';next.querySelector('.book-right').style.visibility='';
  if(epoch===bookTurnEpoch){bookAnimation=null;renderBook();}
  turn.dispose();
 }
 return completed;
}
async function runBookTurns(){
 if(bookTurnRunning||bookBusy)return;
 const epoch=bookTurnEpoch;bookTurnRunning=true;bookBusy=true;
 try{
  while(bookTurnQueue.length&&epoch===bookTurnEpoch&&$('#book-dialog').open){
   const job=bookTurnQueue.shift();bookTurnTarget=job.target;updateBookControls();
   if(job.target===(bookOpened?bookPage:-1)){job.resolve(true);continue;}
   let done;
   if(job.target===-1)done=await closeBookCover(true);
   else{
    done=bookOpened||await openBookCover(true);
    if(done&&job.target!==bookPage)done=await performBookTurn(job.target,epoch);
   }
   job.resolve(done);if(!done)break;
  }
 }finally{
  if(epoch===bookTurnEpoch){bookTurnTarget=null;bookTurnRunning=false;bookBusy=false;renderBook();}
 }
}
function flipBook(dir,destination){
 if(!bookOpened&&!bookTurnRunning){if(dir>0&&!bookBusy)return openBookCover();return Promise.resolve(false);}
 if(bookBusy&&!bookTurnRunning)return Promise.resolve(false);
 const target=destination===undefined?intendedBookPage()+dir:Math.floor(destination/bookSize());
 if(target< -1||target>=bookTotal()||target===intendedBookPage())return Promise.resolve(false);
 const promise=new Promise(resolve=>bookTurnQueue.push({target,resolve}));
 readyBookSpread(ensureBookSpread(target));
 if(bookTurnRunning&&!matchMedia('(prefers-reduced-motion:reduce)').matches)bookAnimation?.setSpeed?.(1.4);
 updateBookControls();runBookTurns();return promise;
}
$('#open-book').addEventListener('click',()=>{
 closeSortMenu();closeDimensionMenu();cancelBookNavigation();previousBookMobile=bookMobile();bookDishes=visibleDishes();if(!bookDishes.length)return;
 bookCategories=groupBookDishes(bookDishes);prepareBookSheets();bookOpened=false;bookBusy=false;bookPage=0;$('#book-subtitle').textContent=`${category==='全部'?'做过的好菜，慢慢记下来。':category} · ${bookDishes.length} 道菜`;
 mountBook();$('#book-dialog').showModal();$('#book-cover').focus({preventScroll:true});
});
$('#close-book').addEventListener('click',()=>$('#book-dialog').close());
$('#book-dialog').addEventListener('close',()=>{cancelBookNavigation();bookOpened=false;$('#open-book').focus({preventScroll:true});});
$('#book-toc').addEventListener('click',async()=>{if(bookBusy&&!bookTurnRunning)return;if(!bookOpened)await openBookCover();flipBook(1,0);});
$('#book-prev').addEventListener('click',()=>flipBook(-1));$('#book-next').addEventListener('click',()=>flipBook(1));
$('#book-dialog').addEventListener('keydown',e=>{if($('#detail').open)return;const dir={ArrowRight:1,ArrowLeft:-1,...(previousBookMobile?{ArrowDown:1,ArrowUp:-1}:{})}[e.key];if(dir){e.preventDefault();flipBook(dir);}});
async function closeBookCover(fromQueue=false){
 if((bookBusy&&!fromQueue)||!bookOpened)return false;bookBusy=true;const epoch=bookTurnEpoch;updateBookControls();
 const root=$('#recipe-book'),cover=root.querySelector('.bound-cover');
 const left=root.querySelector(`[data-spread="${bookPage}"] .${previousBookMobile?'book-right':'book-left'}`);
 if(left)cover.querySelector('.cover-back').replaceChildren(left.cloneNode(true));
 const rotation=previousBookMobile?'rotateX':'rotateY',angle=previousBookMobile?180:-180;
 cover.getAnimations().forEach(a=>a.cancel());cover.style.transform=`${rotation}(${angle}deg)`;cover.hidden=false;
 root.classList.add('closing','is-closed');
 bookAnimation=cover.animate([{transform:`${rotation}(${angle}deg)`},{transform:`${rotation}(0deg)`}],{duration:matchMedia('(prefers-reduced-motion:reduce)').matches?1:1150,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
 let completed=false;
 try{await bookAnimation.finished;
  if(epoch!==bookTurnEpoch)return false;
  bookOpened=false;bookPage=0;completed=true;
 }catch{}finally{
  if(epoch!==bookTurnEpoch)return false;
  root.classList.remove('closing');bookBusy=fromQueue;bookAnimation=null;renderBook();
  cover.style.transform='';cover.querySelector('.cover-back').innerHTML=bookPageHTML(0,'left');
  if($('#book-dialog').open)$('#book-cover').focus({preventScroll:true});
 }
 return completed;
}
$('#book-menu-focus').addEventListener('click',()=>closeBookCover());
let bookPointerStart=null;
$('#recipe-book').addEventListener('pointerdown',e=>{bookPointerStart={x:e.clientX,y:e.clientY};});
function paperTurnDirection(e){
 const rect=$('#recipe-book').getBoundingClientRect();
 return previousBookMobile?(e.clientY>=rect.top+rect.height/2?1:-1):(e.clientX>=rect.left+rect.width/2?1:-1);
}
function turnFromPaperBlank(e){
 if(!bookOpened||(bookBusy&&!bookTurnRunning)||e.defaultPrevented)return;
 if(bookPointerStart&&Math.hypot(e.clientX-bookPointerStart.x,e.clientY-bookPointerStart.y)>8)return;
 if(window.getSelection()?.toString())return;
 if(e.target.closest('button,a,input,select,textarea,[role="button"],.book-recommendation-note'))return;
 if(bookTurnRunning){const rect=$('#recipe-book').getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)flipBook(paperTurnDirection(e));return;}
 const page=e.target.closest('.book-page');if(!page)return;
 const pageRect=page.getBoundingClientRect();
 // The outer half of the left sheet turns back even over printed text and illustration.
 if(!previousBookMobile&&page.classList.contains('book-left')&&e.clientX<pageRect.left+pageRect.width/2){flipBook(-1);return;}
 if(e.target.closest('img,svg'))return;
 // Printed text remains selectable; only unprinted paper turns the page.
 const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
 for(let node=walker.nextNode();node;node=walker.nextNode()){
  if(!node.textContent.trim())continue;
  const range=document.createRange();range.selectNodeContents(node);
  if([...range.getClientRects()].some(r=>e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))return;
 }
 flipBook(paperTurnDirection(e));
}
$('#recipe-book').addEventListener('click',e=>{
 if(e.target.closest('#book-cover')){openBookCover();return;}
 const jump=e.target.closest('[data-book-page]');if(jump){flipBook(1,Number(jump.dataset.bookPage));return;}
 if(bookBusy){turnFromPaperBlank(e);return;}
 const item=e.target.closest('[data-book-dish],[data-book-record]');
 if(!item){turnFromPaperBlank(e);return;}
 const d=dishes.find(d=>d.id===Number(item.dataset.bookDish||item.dataset.bookRecord));
 openDishDetail(d,item.closest('.book-recommendation-note'));
});
let bookTouch=null;
$('#recipe-book').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.book-recommendation-note')){e.preventDefault();e.target.click();}});
$('#recipe-book').addEventListener('touchstart',e=>{const scroll=e.target.closest('.book-menu-list,.editorial-toc');if(e.target.closest('.book-recommendation-note')||(previousBookMobile&&scroll&&scroll.scrollHeight>scroll.clientHeight+1)){bookTouch=null;return;}bookTouch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
$('#recipe-book').addEventListener('touchend',e=>{if(!bookTouch)return;const dx=e.changedTouches[0].clientX-bookTouch.x,dy=e.changedTouches[0].clientY-bookTouch.y;bookTouch=null;const distance=previousBookMobile?dy:dx,cross=previousBookMobile?dx:dy;if(Math.abs(distance)>55&&Math.abs(distance)>Math.abs(cross)*1.5)flipBook(distance<0?1:-1);},{passive:true});
let previousBookMobile=bookMobile(),bookResizeFrame=0;
function adaptBookToWindow(){
 bookResizeFrame=0;
 if(bookBusy){bookResizeFrame=requestAnimationFrame(adaptBookToWindow);return;}
 const mobile=bookMobile();if(mobile===previousBookMobile)return;
 const originId=detailSource?.dataset.bookDish;
 const originIndex=originId?bookSheets.findIndex(x=>x.type==='recommendation'&&String(x.d.id)===originId):-1;
 const firstIndex=originIndex>=0?originIndex:bookPage*(previousBookMobile?1:2);
 bookPage=Math.floor(firstIndex/(mobile?1:2));previousBookMobile=mobile;
 if($('#book-dialog').open){
  mountBook();
  if(originId&&$('#detail').open){detailSource=$('#recipe-book').querySelector(`[data-spread="${bookPage}"] .book-recommendation-note[data-book-dish="${originId}"]`);if(detailSource){detailSource.style.visibility='hidden';detailSource.inert=true;}}
 }
}
window.addEventListener('resize',()=>{if(!bookResizeFrame)bookResizeFrame=requestAnimationFrame(adaptBookToWindow);});

/* Amicro / 3D Dither Lab Book adaptation
Source: https://github.com/Subhan-code/Amicro--Micro-transitions-/blob/main/src/components/dither-charts/DitherBook.tsx
The original component marks SPDX-License-Identifier: Apache-2.0.
Repository license: MIT, Copyright (c) 2026 SYED SUBHAN UDDIN.
Changes: converted React Motion to native Web Animations; added recipe content,
fullscreen dialog, responsive pages, accessibility and local assets.
MIT License

Copyright (c) 2026 SYED  SUBHAN UDDIN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
