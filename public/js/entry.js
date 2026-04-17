document.addEventListener('DOMContentLoaded', async function() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  if (!id) {
    document.getElementById('entryDetail').innerHTML = '<div class="empty-state">未指定文章</div>';
    return;
  }

  try {
    var res = await fetch('/api/entries/' + encodeURIComponent(id));
    if (!res.ok) throw new Error('Not found');
    var data = await res.json();

    // Update page title
    document.title = data.title + ' — Pepe & Yuan\'s Love Diary';

    // Page Hero
    var hero = document.getElementById('entryHero');
    var heroBg = document.getElementById('entryHeroBg');
    var heroLabel = document.getElementById('entryHeroLabel');
    var heroTitle = document.getElementById('entryHeroTitle');

    heroBg.style.backgroundImage = 'url(\'' + getImageSrc(data.image) + '\')';
    heroLabel.textContent = data.location || getCategoryLabel(data.category);
    heroTitle.textContent = data.title;
    hero.style.display = '';

    // Article content
    var container = document.getElementById('entryDetail');
    var paragraphs = (data.story || '').split('\n\n').filter(function(p) { return p.trim(); });
    var storyHtml = paragraphs.map(function(p) {
      return '<p class="entry-paragraph">' + escapeHtml(p) + '</p>';
    }).join('');

    var tagsHtml = (data.tags || []).length > 0
      ? '<div class="entry-tags">' + data.tags.map(function(t) { return '<span class="tag">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
      : '';

    container.innerHTML =
      '<div class="entry-meta">' +
        '<span class="entry-meta-date">' + formatDate(data.date) + '</span>' +
        (data.location ? '<span class="entry-meta-sep">/</span><span class="entry-meta-location">' + escapeHtml(data.location) + '</span>' : '') +
        (data.category ? '<span class="entry-meta-sep">/</span><span class="entry-meta-category">' + getCategoryLabel(data.category) + '</span>' : '') +
      '</div>' +
      '<div class="entry-story">' + storyHtml + '</div>' +
      tagsHtml;

    // Prev/Next navigation
    var pagerContainer = document.getElementById('entryPager');
    if (data.prevEntry || data.nextEntry) {
      pagerContainer.innerHTML =
        '<nav class="entry-pager">' +
          '<div class="entry-pager-item entry-pager-prev">' +
            (data.prevEntry ? '<a href="/entry.html?id=' + encodeURIComponent(data.prevEntry.id) + '"><span class="entry-pager-label">&larr; 上一篇</span><span class="entry-pager-title">' + escapeHtml(data.prevEntry.title) + '</span></a>' : '') +
          '</div>' +
          '<div class="entry-pager-item entry-pager-next">' +
            (data.nextEntry ? '<a href="/entry.html?id=' + encodeURIComponent(data.nextEntry.id) + '"><span class="entry-pager-label">下一篇 &rarr;</span><span class="entry-pager-title">' + escapeHtml(data.nextEntry.title) + '</span></a>' : '') +
          '</div>' +
        '</nav>';
    }

    initReveal();
  } catch (err) {
    document.getElementById('entryDetail').innerHTML = '<div class="empty-state">文章不存在或加载失败</div>';
  }
});
