"""Build the independent homepage without changing the canonical cookbook."""
from pathlib import Path
import re
import base64
import json
from package_offline_demo import build_offline_base

ROOT = Path(__file__).resolve().parents[1]
s = build_offline_base(ROOT)

# Retain the archive, embedded media, dialogs, book, and licenses.
old = s[s.index('<body>') + 6:s.index('<div id="dimension-menu"')]
controls = old[old.index('<section aria-label="查找菜品">'):old.index('<section id="grid"')]
book = re.search(r'<button id="open-book".*?</button>', controls, re.S).group()
controls = controls.replace(book, '')
controls = controls.replace('<section aria-label="查找菜品">', '<section class="catalog-controls" aria-label="查找菜品">')
controls = controls.replace('<div class="sort-control">', '<button id="active-query" class="active-query" hidden aria-label="清除搜索"><span id="query-text"></span><span aria-hidden="true">×</span></button><div class="sort-control">')
# Keep the curated illustration in the offline HTML, alongside the recipe photos.
covers = {}
for path in sorted((ROOT / 'outputs/cookbook/dishes').glob('dish-*/illustration.jpg')):
    dish_id = int(path.parent.name.removeprefix('dish-'))
    covers[dish_id] = 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
header = f'''<a class="skip-catalog" href="#catalog">直接浏览菜品</a>
<div class="kitchen-masthead" id="home"><div class="masthead-inner">
<a class="kitchen-logo" href="#home" aria-label="波仔厨房首页"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 20h26c-1 10-6 14-13 14S8 30 7 20Z" stroke="currentColor" stroke-width="1.6"/><path d="M12 36h16M15 5c-5 5 5 6 0 11M24 3c-5 5 5 7 0 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>波仔厨房</span></a>
<nav class="masthead-nav" aria-label="主导航"><a href="#catalog">菜品</a>{book}</nav>
</div></div>
<section class="kitchen-hero" aria-labelledby="hero-heading" hidden>
  <div class="hero-inner">
    <div class="feature-copy">
      <p class="feature-kicker">今日推荐</p>
      <h1 id="hero-heading"></h1>
      <p class="feature-description"></p>
      <button type="button" id="hero-feature" aria-haspopup="dialog">查看做法</button>
    </div>
    <div class="feature-art"><img id="hero-photo" alt="" fetchpriority="high"></div>
  </div>
</section>
<main class="new-catalog" id="catalog" aria-label="菜品目录">
{controls}
<section id="grid" class="grid" aria-label="我的菜品"></section>
</main>
'''
s = s.replace(old, header, 1)
start = s.index('function render(){')
end = s.index('function closeDimensionMenu()', start)
s = s[:start] + 'const cardIllustrations=' + json.dumps(covers) + ';\n' + '''function render(){
 const previousScroll=$('.filters').scrollLeft;
 $('.filters').setAttribute('aria-label','按'+classification.dimensions[dimension].label+'筛选');
 $('.filters').innerHTML=availableCategories().map(f=>`<button class="chip ${category===f?'active':''}" aria-pressed="${category===f}" data-filter="${f}">${f}</button>`).join('');
 const list=visibleDishes();
 $('#result').textContent=`${category==='全部'?'全部菜品':category} · ${list.length} 道`;
 $('#active-query').hidden=!query;
 $('#query-text').textContent=query;
 $('#active-query').setAttribute('aria-label','清除搜索：'+query);
 $('.filters').scrollLeft=previousScroll;
 $('#open-book').disabled=!list.length;
 $('#grid').innerHTML=list.length?list.map(d=>{
  const tags=d.flavorTags||d.foods,date=latestCookedDate(d);
  return `<button class="card" data-id="${d.id}" aria-label="查看${escapeHTML(d.name)}的做法"><div class="photo"><img loading="lazy" decoding="async" src="${cardIllustrations[d.id] || d.cover}" alt="${escapeHTML(d.name)}${cardIllustrations[d.id] ? '插画' : '实拍'}"></div><div class="card-copy"><h2>${escapeHTML(d.name)}</h2><div class="card-ingredients" title="${escapeHTML(tags.join(' · '))}">${tags.map(t=>`<span class="ingredient-tag">${escapeHTML(t)}</span>`).join('')}</div><div class="card-footer"><span class="last-cooked">${date?date.replaceAll('-','.'): '日期待补'}</span>${d.count>1?`<span>第${d.count}次做</span>`:''}</div></div></button>`;
 }).join(''):'<div class="empty"><p>没有找到符合条件的菜品</p><button id="reset-filters">重置筛选</button></div>';
}
''' + s[end:]
# The source's icon, blur, Escape, query-dot, and focus behavior stays intact.
# Only keep the action group visible while the classification rail scrolls.
start = s.index('function revealSearchDuringExpansion(start){')
end = s.index('function setSearchOpen(open){', start)
s = s[:start] + '''function revealSearchDuringExpansion(start){searchRevealFrame=0;}
''' + s[end:]
components = ROOT / 'work'
start = s.index('<dialog id="detail"')
end = s.index('</dialog>', start) + len('</dialog>')
s = s[:start] + (components / 'kitchen_detail.html').read_text().strip() + s[end:]
start = s.index('function showAttempt(')
end = s.index('let detailSource=', start)
s = s[:start] + (components / 'kitchen_detail.js').read_text() + '\n' + s[end:]
start = s.index("$('#view-photo').addEventListener('click',()=>{", s.index('let detailSource='))
end = s.index("$('#photo-viewer').addEventListener('click'", start)
s = s[:start] + s[end:]
start = s.index('const flourish=')
end = s.index('function kitchenDrawing(', start)
s = s[:start] + s[end:]
start = s.index('function recommendationHTML(')
end = s.index('async function openBookCover(', start)
s = s[:start] + (components / 'kitchen_book.js').read_text() + '\n' + s[end:]
for control in ('prev', 'next'):
    s = re.sub(rf'(<button id="book-{control}"[^>]*>)[^<]*(</button>)', r'\1\2', s, count=1)
s = re.sub(r'<p class="book-help">[^<]*</p>', '', s, count=1)

s = re.sub(r"(?m)^ \$\('#book-(?:prev|next)'\)\.textContent=.*\n", '', s)
s = re.sub(r"(?m)^ \$\('\.book-help'\)\.textContent=.*;updateBookControls\(\);", ' updateBookControls();', s)
start = s.index("$('#book-subtitle').textContent=")
end = s.index(';', start) + 1
s = s[:start] + "$('#book-subtitle').textContent=bookDishes.length+' 道菜 · '+bookCategories.length+' 种做法';" + s[end:]
css = '\n'.join((components / name).read_text() for name in (
    'kitchen_home.css', 'kitchen_detail.css', 'kitchen_book.css'
))
jacket = ROOT / 'outputs/cookbook/design/book-jacket.jpg'
css = css.replace('JACKET_IMAGE_URL', 'data:image/jpeg;base64,' + base64.b64encode(jacket.read_bytes()).decode('ascii'))
stock = ROOT / 'outputs/cookbook/design/page-stock.png'
css = css.replace('PAPER_IMAGE_URL', 'data:image/png;base64,' + base64.b64encode(stock.read_bytes()).decode('ascii'))
script = (ROOT / 'work/kitchen_home.js').read_text()
s = s.replace('</head>', '<style id="kitchen-full-redesign">' + css + '</style></head>', 1)
s = s.replace('<title>波仔厨房 · 我的菜品目录</title>', '<title>波仔厨房 · 私房菜谱</title>', 1)
s = s.replace('</body>', '<script>' + script + '</script></body>', 1)
output = ROOT / 'outputs/波仔厨房-浅底插画首页.html'
from tempfile import NamedTemporaryFile
with NamedTemporaryFile(mode="w", dir=output.parent, delete=False, encoding="utf-8") as tmp:
    tmp.write(s)
Path(tmp.name).chmod(0o644)
Path(tmp.name).replace(output)
print(output)
