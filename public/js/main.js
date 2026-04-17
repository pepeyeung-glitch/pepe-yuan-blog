// --- Navigation ---
function initNav() {
  var nav = document.getElementById('nav');
  var hamburger = document.getElementById('navHamburger');
  var links = document.getElementById('navLinks');

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (hamburger && links) {
    hamburger.addEventListener('click', function() { links.classList.toggle('open'); });
    links.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { links.classList.remove('open'); });
    });
  }
}

// --- Scroll Reveal ---
function initReveal() {
  var elements = document.querySelectorAll('.reveal:not(.visible)');
  if (!elements.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(function(el) { observer.observe(el); });
}

// --- Helpers ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.getFullYear() + '\u5e74' + (d.getMonth() + 1) + '\u6708';
}

function getImageSrc(image) {
  return image || '/public/images/placeholder.jpg';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var categoryLabels = {
  travel: '旅行',
  wedding: '重要时刻',
  daily: '日常生活',
};

function getCategoryLabel(cat) {
  return categoryLabels[cat] || cat;
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  initNav();
  initReveal();
});
