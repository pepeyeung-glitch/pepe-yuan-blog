document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;
  loadEntries();
});

async function loadEntries() {
  try {
    var res = await fetch('/admin/api/entries?limit=100');
    var data = await res.json();
    var tbody = document.getElementById('entriesTable');

    if (data.entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">还没有故事</td></tr>';
      return;
    }

    tbody.innerHTML = data.entries.map(function(entry) {
      return '<tr>' +
        '<td><img class="table-image" src="' + (entry.image || '') + '" alt="" onerror="this.style.display=\'none\'"></td>' +
        '<td style="font-weight:500;">' + (entry.title || '') + '</td>' +
        '<td>' + formatDate(entry.date) + '</td>' +
        '<td>' + (entry.location || '') + '</td>' +
        '<td>' + getCategoryLabel(entry.category) + '</td>' +
        '<td><div class="table-actions">' +
          '<a href="/admin/entry-form.html?id=' + entry.id + '">编辑</a>' +
          '<button class="delete-btn" onclick="deleteEntry(\'' + entry.id + '\')">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    document.getElementById('entriesTable').innerHTML =
      '<tr><td colspan="6" style="text-align:center;">加载失败</td></tr>';
  }
}

async function deleteEntry(id) {
  if (!confirm('确定要删除这条故事吗？')) return;

  try {
    var res = await fetch('/admin/api/entries/' + id, { method: 'DELETE' });
    var data = await res.json();
    if (data.success) {
      showToast('已删除');
      loadEntries();
    } else {
      showToast(data.error || '删除失败', true);
    }
  } catch (err) {
    showToast('删除失败', true);
  }
}
