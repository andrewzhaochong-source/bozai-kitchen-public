(() => {
  // Keep the dimension control anchored while the search expands to its left.
  // This also keeps its popover aligned when search collapses on blur.
  $('.nav-actions').prepend($('.search-control'));
  $('.filters').addEventListener('pointerdown', e => {
    if (e.target.closest('[data-filter]') && document.activeElement === $('#search')) {
      // Complete the filter click before blur changes the rail's available width.
      e.preventDefault();
    }
  });

  // Choose the feature once per page load from the recipes with an illustration.
  const illustratedRecipes = dishes.filter(dish => cardIllustrations[dish.id]);
  const coverRecipe = illustratedRecipes[Math.floor(Math.random() * illustratedRecipes.length)];
  if (coverRecipe) {
    const photo = $('#hero-photo');
    const feature = $('#hero-feature');
    $('#hero-heading').textContent = coverRecipe.name;
    $('.feature-description').textContent = coverRecipe.summary || (coverRecipe.flavorTags || coverRecipe.foods || []).join(' · ');
    photo.alt = coverRecipe.name + '插画';
    photo.src = cardIllustrations[coverRecipe.id];
    feature.setAttribute('aria-label', '查看' + coverRecipe.name + '的做法');
    feature.addEventListener('click', () => openDishDetail(coverRecipe));
    $('.kitchen-hero').hidden = false;
  }

  function clearSearch(resetCategory = false) {
    query = '';
    $('#search').value = '';
    $('#search-toggle').classList.remove('has-query');
    $('#search-toggle').setAttribute('aria-label', '搜索菜名或食材');
    if (resetCategory) category = '全部';
    render();
    $('#search-toggle').focus({preventScroll: true});
  }
  $('#active-query').addEventListener('click', () => clearSearch());
  $('#grid').addEventListener('click', e => {
    if (e.target.closest('#reset-filters')) clearSearch(true);
  });

  // Native modal close keeps the originating control available to keyboard users.
  let detailTrigger = null;
  document.addEventListener('click', e => {
    const trigger = e.target.closest('#hero-feature, #grid .card');
    if (trigger) detailTrigger = trigger;
  }, true);
  $('#detail').addEventListener('close', () => {
    if (detailTrigger?.isConnected && !$('#book-dialog').open) {
      detailTrigger.focus({preventScroll: true});
    }
    detailTrigger = null;
  });
})();
