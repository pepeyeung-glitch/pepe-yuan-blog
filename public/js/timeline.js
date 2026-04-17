document.addEventListener('DOMContentLoaded', async function() {
  var currentCategory = '';
  var currentPage = 1;
  var totalPages = 1;
  var limit = 12;

  var grid = document.getElementById('journalGrid');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  var loadMoreBtn = document.getElementById('loadMoreBtn');

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1;
      loadEntries(true);
    });
  });

  loadMoreBtn.addEventListener('click', function() {
    currentPage++;
    loadEntries(false);
  });

  async function loadEntries(replace) {
    if (replace) {
      grid.innerHTML = '<div class="loading" style="grid-column:1/-1;"><div class="loading-spinner"></div></div>';
    }

    try {
      var url = '/api/entries?page=' + currentPage + '&limit=' + limit;
      if (currentCategory) url += '&category=' + currentCategory;

      var res = await fetch(url);
      var data = await res.json();
      totalPages = data.totalPages;

      if (replace) grid.innerHTML = '';

      if (data.entries.length === 0 && replace) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">这个分类暂时还没有故事</div>';
        loadMoreWrap.style.display = 'none';
        return;
      }

      // Get current card count for featured pattern
      var existingCards = grid.querySelectorAll('.journal-card').length;

      data.entries.forEach(function(entry, i) {
        var globalIndex = existingCards + i;
        var isFeatured = (globalIndex % 5 === 0); // Every 5th card is featured

        var card = document.createElement('article');
        card.className = 'journal-card' + (isFeatured ? ' featured' : '');
        card.onclick = function() { location.href = '/entry.html?id=' + encodeURIComponent(entry.id); };

        card.innerHTML =
          '<div class="journal-card-image-wrap">' +
            '<img class="journal-card-image" src="' + escapeHtml(getImageSrc(entry.image)) + '" alt="' + escapeHtml(entry.title) + '" loading="lazy">' +
          '</div>' +
          '<div class="journal-card-content">' +
            '<div class="journal-card-date">' + formatDate(entry.date) + '</div>' +
            '<h3 class="journal-card-title">' + escapeHtml(entry.title) + '</h3>' +
            '<div class="journal-card-location">' + escapeHtml(entry.location || '') + '</div>' +
          '</div>';

        grid.appendChild(card);
      });

      loadMoreWrap.style.display = currentPage < totalPages ? 'block' : 'none';
    } catch (err) {
      if (replace) grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">加载失败</div>';
    }
  }

  loadEntries(true);
});
