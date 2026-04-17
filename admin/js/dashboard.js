document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;

  try {
    var res = await fetch('/admin/api/stats');
    var stats = await res.json();

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statTravel').textContent = stats.travel;
    document.getElementById('statWedding').textContent = stats.wedding;
    document.getElementById('statDaily').textContent = stats.daily;

    if (stats.latest) {
      document.getElementById('latestStory').innerHTML =
        '<p style="margin-bottom:4px;font-weight:600;">' + stats.latest.title + '</p>' +
        '<p style="font-size:0.8rem;color:var(--admin-text-muted);">' +
          formatDate(stats.latest.date) + ' — ' + (stats.latest.location || '') +
        '</p>';
    } else {
      document.getElementById('latestStory').textContent = '还没有故事';
    }
  } catch (err) {
    document.getElementById('latestStory').textContent = '加载失败';
  }
});
