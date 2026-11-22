// Illustration and text come from the same filtered collection as the homepage.
function bookIllustration(dish) {
  return cardIllustrations[dish.id] || dish.cover;
}

function recommendationHTML(dish) {
  const date = latestCookedDate(dish);
  const tip = (dish.tips || []).find(text => text && !/^未记录[。.]?$/.test(text)) || '';
  return `<h2 class="recommendation-title">主厨推荐</h2>
    <article class="book-recommendation-note" tabindex="0" role="button"
      data-book-dish="${dish.id}" aria-label="查看${escapeHTML(dish.name)}的做法">
      <div class="detail-paper">
        <div class="detail-top"><img src="${bookIllustration(dish)}" alt=""></div>
        <div class="detail-body">
          ${date ? `<small class="note-date">${escapeHTML(date)}</small>` : ''}
          <h3>${escapeHTML(dish.name)}</h3>
          ${tip ? `<p class="note-excerpt">${escapeHTML(tip)}</p>` : ''}
        </div>
      </div>
    </article>`;
}

function pickBookDish(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const contentsRecommendation = pickBookDish(dishes);
const categoryRecommendations = new Map(
  groupBookDishes(dishes).map(({name, items}) => [name, pickBookDish(items)])
);

function prepareBookSheets() {
  const entriesPerPage = 5;
  bookSheets = [];
  for (let start = 0; start < bookCategories.length; start += entriesPerPage) {
    bookSheets.push({
      type: 'toc',
      groups: bookCategories.slice(start, start + entriesPerPage),
      showHeading: start === 0
    });
  }
  if (bookSheets.length % 2) {
    bookSheets.push({type: 'recommendation', d: contentsRecommendation});
  }
  for (const g of bookCategories) {
    g.page = bookSheets.length;
    bookSheets.push({type: 'chapter', g});
    const dishesPerPage = 5;
    for (let start = 0; start < g.items.length; start += dishesPerPage) {
      bookSheets.push({type: 'menu', g, items: g.items.slice(start, start + dishesPerPage)});
    }
    if (bookSheets.length % 2) {
      bookSheets.push({type: 'recommendation', d: categoryRecommendations.get(g.name)});
    }
  }
}

function bookContentsHTML({groups, showHeading}) {
  const rows = groups.map(g => `<button data-book-page="${g.page}" aria-label="跳到${escapeHTML(g.name)}，第 ${g.page+1} 页">
    <span class="toc-drawing" aria-hidden="true">${kitchenDrawing(g.name)}</span>
    <span class="toc-entry"><strong>${escapeHTML(g.name)}</strong><small>${escapeHTML(g.items.slice(0,2).map(d => d.name).join(' · '))}</small></span>
    <span class="toc-folio">${String(g.page+1).padStart(2, '0')}</span></button>`).join('');
  return `${showHeading ? '<div class="book-section-heading"><h2>目录</h2></div>' : ''}
    <div class="editorial-toc">${rows}</div>`;
}

function bookChapterHTML(g) {
  const note = chapterNotes[g.name];
  return `<div class="book-chapter">
    <h2>${escapeHTML(g.name)}</h2>
    <figure class="chapter-art">
      ${kitchenDrawing(g.name)}
      ${note ? `<figcaption>${escapeHTML(note)}</figcaption>` : ''}
    </figure>
  </div>`;
}

function bookMenuHTML(page) {
  const rows = page.items.map(dish => {
    const ingredients = (dish.flavorTags || dish.foods || []).join(' · ');
    return `<button class="book-menu-item" data-book-dish="${dish.id}">
      <span class="book-item-copy"><strong>${escapeHTML(dish.name)}</strong>
      ${ingredients ? `<span title="${escapeHTML(ingredients)}">${escapeHTML(ingredients)}</span>` : ''}</span>
      <img src="${bookIllustration(dish)}" alt=""></button>`;
  }).join('');
  return `<h2 class="book-menu-label">${escapeHTML(page.g.name)}</h2>
    <div class="book-menu-list">${rows}</div>`;
}

function bookPageHTML(index, side) {
  const page = bookSheets[index];
  if (!page) return `<section class="book-page book-${side} book-end"></section>`;
  let content;
  switch (page.type) {
    case 'toc': content = bookContentsHTML(page); break;
    case 'chapter': content = bookChapterHTML(page.g); break;
    case 'menu': content = bookMenuHTML(page); break;
    case 'recommendation': content = recommendationHTML(page.d); break;
  }
  return `<section class="book-page book-${side} editorial-page type-${page.type}">
    <div class="editorial-content">${content}</div>
    <div class="book-page-foot"><span>波仔厨房</span><span>${String(index+1).padStart(2, '0')}</span></div>
  </section>`;
}

function bookCoverHTML() {
  return `<button class="book-cover reference-cover" id="book-cover" aria-label="翻开波仔厨房菜谱书">
    <span class="jacket-title">波仔厨房</span>
    <span class="jacket-subtitle">做过的好菜，慢慢记下来</span>
  </button>`;
}

const bookWheel = { lastAt: -Infinity, direction: 0, distance: 0, consumed: false };
$('#book-dialog').addEventListener('close', () => { bookWheel.lastAt = -Infinity; });
$('#book-dialog').addEventListener('wheel', event => {
  const { deltaX, deltaY, deltaMode, timeStamp } = event;
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || $('#detail').open ||
      !deltaY || Math.abs(deltaY) <= Math.abs(deltaX)) return;

  const direction = Math.sign(deltaY);
  // Treat a burst of wheel events, including trackpad momentum, as one gesture.
  if (timeStamp - bookWheel.lastAt > 180 || direction !== bookWheel.direction) {
    bookWheel.distance = 0;
    bookWheel.consumed = false;
  }
  bookWheel.lastAt = timeStamp;
  bookWheel.direction = direction;

  const list = event.target.closest('.book-menu-list, .editorial-toc');
  if (list && (direction < 0 ? list.scrollTop > 1 :
      list.scrollHeight - list.clientHeight - list.scrollTop > 1)) {
    bookWheel.consumed = true;
    return;
  }
  event.preventDefault();
  if (bookWheel.consumed) return;
  bookWheel.distance += Math.abs(deltaY);
  if (deltaMode === 0 && bookWheel.distance < 32) return;

  bookWheel.consumed = true;
  flipBook(direction);
}, { passive: false });
