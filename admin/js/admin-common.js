// Admin common utilities
async function checkAuth() {
  try {
    var res = await fetch('/auth/check');
    var data = await res.json();
    if (!data.authenticated) {
      location.href = '/admin/login';
      return false;
    }
    return true;
  } catch (err) {
    location.href = '/admin/login';
    return false;
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  location.href = '/admin/login';
}

function showToast(message, isError) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

var categoryLabels = { travel: '旅行', wedding: '重要时刻', daily: '日常生活' };
function getCategoryLabel(cat) { return categoryLabels[cat] || cat; }
