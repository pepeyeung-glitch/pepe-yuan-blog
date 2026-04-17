document.addEventListener('DOMContentLoaded', async function() {
  // Load homepage data from CMS
  try {
    var res = await fetch('/api/homepage');
    var data = await res.json();
    if (data.title) document.getElementById('heroTitle').textContent = data.title;
    if (data.subtitle) document.getElementById('heroSubtitle').textContent = data.subtitle;
    if (data.ctaText) document.getElementById('heroCta').textContent = data.ctaText;
    if (data.ctaLink) document.getElementById('heroCta').href = data.ctaLink;
    if (data.heroImage) document.getElementById('heroBg').style.backgroundImage = 'url(' + data.heroImage + ')';
  } catch (err) {
    // Defaults in HTML
  }

  // Load latest stories
  try {
    var res2 = await fetch('/api/entries?limit=3');
    var data2 = await res2.json();
    var container = document.getElementById('latestEntries');

    if (data2.entries.length === 0) {
      container.innerHTML = '<div class="empty-state">还没有故事，美好正在路上...</div>';
      return;
    }

    container.innerHTML = data2.entries.map(function(entry) {
      return '<article class="story-card reveal" onclick="location.href=\'/entry.html?id=' + encodeURIComponent(entry.id) + '\'">' +
        '<img class="story-card-image" src="' + escapeHtml(getImageSrc(entry.image)) + '" alt="' + escapeHtml(entry.title) + '" loading="lazy">' +
        '<div class="story-card-overlay">' +
          '<h3 class="story-card-title">' + escapeHtml(entry.title) + '</h3>' +
          '<div class="story-card-meta">' + formatDate(entry.date) + ' &mdash; ' + escapeHtml(entry.location || '') + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    initReveal();
  } catch (err) {
    document.getElementById('latestEntries').innerHTML = '<div class="empty-state">加载失败</div>';
  }

  // Contact form
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('contactSubmit');
      btn.disabled = true;
      btn.textContent = '发送中...';

      try {
        var res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            message: document.getElementById('contactMessage').value,
          }),
        });
        var data = await res.json();
        if (data.success) {
          contactForm.style.display = 'none';
          document.getElementById('contactSuccess').style.display = 'block';
        } else {
          btn.disabled = false;
          btn.textContent = '发送消息';
          alert(data.error || '发送失败，请重试');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = '发送消息';
        alert('发送失败，请重试');
      }
    });
  }
});
