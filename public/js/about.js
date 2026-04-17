document.addEventListener('DOMContentLoaded', async function() {
  try {
    var res = await fetch('/api/about');
    var data = await res.json();

    if (data.heading) {
      document.getElementById('aboutHeading').textContent = data.heading;
    }

    if (data.heroImage) {
      var heroBg = document.querySelector('.page-hero-bg');
      if (heroBg) heroBg.style.backgroundImage = 'url(' + data.heroImage + ')';
    }

    // Top paragraphs (above image)
    var container = document.getElementById('aboutContent');
    var contentTitle = data.contentTitle || '';
    var topParas = data.topParagraphs || [];

    var html = '';
    if (contentTitle) {
      html += '<p class="about-lead reveal">' + escapeHtml(contentTitle) + '</p>';
    }
    topParas.forEach(function(p) {
      html += '<p class="about-paragraph reveal">' + escapeHtml(p) + '</p>';
    });
    if (html) container.innerHTML = html;

    // Mid image
    if (data.midImage) {
      var midImg = document.querySelector('.about-image-break img');
      if (midImg) midImg.src = data.midImage;
    }

    // Bottom paragraphs (below image)
    var closing = document.getElementById('aboutClosing');
    var bottomParas = data.bottomParagraphs || [];
    if (bottomParas.length > 0) {
      var closingHtml = '';
      bottomParas.forEach(function(p) {
        closingHtml += '<p class="about-paragraph reveal">' + escapeHtml(p) + '</p>';
      });
      closingHtml += '<div class="about-divider reveal"><svg class="about-divider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 3v18M3 12h18"/></svg></div>';
      closing.innerHTML = closingHtml;
    }

    initReveal();
  } catch (err) {
    document.getElementById('aboutContent').innerHTML = '<div class="empty-state">加载失败</div>';
  }
});
