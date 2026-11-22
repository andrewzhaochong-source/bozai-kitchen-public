// The album and the selected cooking record stay paired as the reader moves
// through real photos. Opening from any entry point starts with the cover.
let recipePhotos = [];
let recipePhotoIndex = 0;

function cleanRecipeSection(text) {
  return (text || '').replace(/^\[返回菜品\]\(\.\.\/\.\.\/recipe\.md\)\s*$/gm, '').trim();
}

function recipeParagraphs(text) {
  return cleanRecipeSection(text).split(/\n+/).map(line => {
    return '<p>' + escapeHTML(line.replace(/^-\s+/, '')) + '</p>';
  }).join('');
}

function recipeMethod(text, steps) {
  const parts = [];
  let numbered = [];
  function flushSteps() {
    if (!numbered.length) return;
    parts.push('<ol>' + numbered.map(line => '<li>' + escapeHTML(line) + '</li>').join('') + '</ol>');
    numbered = [];
  }
  for (const line of cleanRecipeSection(text).split(/\n/)) {
    if (!line.trim()) continue;
    const step = line.match(/^\s*\d+[.)、]\s*(.+)$/);
    if (step) numbered.push(step[1]);
    else {
      flushSteps();
      parts.push(recipeParagraphs(line));
    }
  }
  flushSteps();
  if (parts.length) return parts.join('');
  return '<ol>' + steps.map(line => '<li>' + escapeHTML(line) + '</li>').join('') + '</ol>';
}

function renderCookingRecord(d, attempt) {
  current = {...d, ...attempt};
  const sections = new Map();
  for (const match of attempt.record.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) {
    sections.set(match[1].trim(), cleanRecipeSection(match[2]));
  }
  const ingredients = sections.get('食材与调味') || attempt.ingredients;
  $('#ingredients').innerHTML = recipeParagraphs(ingredients);
  $('#ingredients-panel').hidden = !cleanRecipeSection(ingredients);
  const method = sections.get('本次实际做法');
  $('#steps').innerHTML = recipeMethod(method, attempt.steps);
  $('#steps').parentElement.hidden = !method && !attempt.steps.length;
  $('#source').textContent = attempt.source;
  $('#source').hidden = true;
  $('#source-toggle').setAttribute('aria-expanded', 'false');
  $('#source-toggle').textContent = '查看原始口述';
  $('#source-toggle').hidden = !attempt.source.trim();
  $('#record-date').textContent = attempt.cookedAt || '做菜日期待补';

  const notes = [];
  const extra = [];
  for (const [title, body] of sections) {
    if (['食材与调味', '本次实际做法'].includes(title) || !body || /^未记录[。.]?$/.test(body)) continue;
    const important = /^(复做|本次感受|下次改进|火候与下次改进)/.test(title);
    const heading = title.replace(/^复做时的关键(点|顺序)$/, '复做要点');
    (important ? notes : extra).push('<section><h4>' + escapeHTML(heading) + '</h4>' + recipeParagraphs(body) + '</section>');
  }
  if (d.tips.length && !notes.length) {
    notes.push('<section><h4>复做要点</h4>' + d.tips.map(recipeParagraphs).join('') + '</section>');
  }
  $('#record-notes').innerHTML = notes.join('');
  $('#record-extra > div').innerHTML = extra.join('');
  $('#record-extra').hidden = !extra.length;
  $('#record-extra').open = false;
  $('#timeline').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.attempt === attempt.key));
  });
}

function displayRecipePhoto(d, index) {
  recipePhotoIndex = index;
  const image = recipePhotos[index];
  if (image.attempt && current.key !== image.attempt.key) renderCookingRecord(d, image.attempt);
  $('#detail-img').src = image.src;
  $('#detail-img').alt = d.name + ' · ' + image.label;
  $('#view-photo').setAttribute('aria-label', '放大' + $('#detail-img').alt);
  $('#gallery-label').textContent = image.label;
  $('#gallery-count').textContent = '，第 ' + (index + 1) + ' 张，共 ' + recipePhotos.length + ' 张';
  $('#gallery-prev').hidden = $('#gallery-next').hidden = recipePhotos.length < 2;
}

function showAttempt(d, key) {
  const attempt = d.attempts.find(item => item.key === key);
  if (!attempt) return;
  // Existing timeline controls call this while the dialog is open.
  if ($('#detail').open && current?.id === d.id) {
    renderCookingRecord(d, attempt);
    const photo = recipePhotos.findIndex(image => image.attempt?.key === key);
    displayRecipePhoto(d, photo < 0 ? 0 : photo);
    return;
  }

  $('#detail-name').textContent = d.name;
  $('#detail-meta').textContent = [d.cuisine, ...d.tags].filter(Boolean).join(' · ');
  const chronological = [...d.attempts].sort((a, b) =>
    (a.cookedAt || '\uffff').localeCompare(b.cookedAt || '\uffff') || a.key.localeCompare(b.key));
  const dates = new Map(chronological.map(a => [
    a.key, a.cookedAt?.match(/^\d{4}-\d{2}-\d{2}(?=$|[ T])/)?.[0] || a.cookedAt || ''
  ]));
  const labels = new Map(chronological.map((a, i) => [
    a.key, dates.get(a.key) ? '第' + (i + 1) + '次做·' + dates.get(a.key) : '日期待补记录'
  ]));
  // The opening record is always the first photograph, even with unknown dates.
  const remaining = chronological.filter(a => a.key !== key);
  const ordered = [attempt, ...remaining.filter(a => a.cookedAt).reverse(), ...remaining.filter(a => !a.cookedAt)];
  recipePhotos = ordered.filter(a => a.photo).map(a => ({
    src: a.photo, attempt: a, label: dates.get(a.key) ? dates.get(a.key) + '记录' : '实拍记录'
  }));
  if (cardIllustrations[d.id]) recipePhotos.unshift({src: cardIllustrations[d.id], label: '插画封面'});
  if (!recipePhotos.length) recipePhotos.push({src: d.image || d.cover, label: '菜品照片'});
  $('#timeline').innerHTML = ordered.map(a =>
    '<button type="button" data-attempt="' + escapeHTML(a.key) + '">' +
    escapeHTML(labels.get(a.key)) + '</button>').join('');
  $('#timeline').parentElement.hidden = ordered.length <= 1;
  renderCookingRecord(d, attempt);
  displayRecipePhoto(d, 0);
}

function moveRecipePhoto(offset) {
  const dish = dishes.find(item => item.id === current?.id);
  if (!dish || recipePhotos.length < 2) return;
  displayRecipePhoto(dish, (recipePhotoIndex + offset + recipePhotos.length) % recipePhotos.length);
}

$('#gallery-prev').addEventListener('click', () => moveRecipePhoto(-1));
$('#gallery-next').addEventListener('click', () => moveRecipePhoto(1));
$('#detail .recipe-return').addEventListener('click', () => closeDishDetail());
$('#detail').addEventListener('keydown', event => {
  if (event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  moveRecipePhoto(event.key === 'ArrowLeft' ? -1 : 1);
});
$('#view-photo').addEventListener('click', () => {
  const image = $('#detail-img');
  $('#full-photo').src = image.src;
  $('#full-photo').alt = image.alt;
  $('#photo-viewer').setAttribute('aria-label', image.alt);
  $('#photo-viewer').showModal();
  $('#photo-viewer').focus({preventScroll: true});
});
