document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;
  loadMessages();
});

async function loadMessages() {
  try {
    var res = await fetch('/admin/api/messages');
    var data = await res.json();
    var tbody = document.getElementById('msgBody');
    var countEl = document.getElementById('msgCount');

    countEl.textContent = '共 ' + data.messages.length + ' 条消息';

    if (data.messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">还没有收到消息</td></tr>';
      return;
    }

    tbody.innerHTML = data.messages.map(function(msg) {
      var date = new Date(msg.createdAt);
      var timeStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0');

      return '<tr>' +
        '<td><strong>' + escapeHtml(msg.name) + '</strong></td>' +
        '<td>' + escapeHtml(msg.email) + '</td>' +
        '<td style="max-width:320px;white-space:pre-wrap;word-break:break-word;">' + escapeHtml(msg.message) + '</td>' +
        '<td style="white-space:nowrap;font-size:0.8rem;color:#999;">' + timeStr + '</td>' +
        '<td><div class="table-actions"><button class="delete-btn" onclick="deleteMsg(\'' + msg.id + '\')">删除</button></div></td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    document.getElementById('msgBody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:#e74c3c;">加载失败</td></tr>';
  }
}

async function deleteMsg(id) {
  if (!confirm('确认删除这条消息？')) return;
  try {
    var res = await fetch('/admin/api/messages/' + id, { method: 'DELETE' });
    var data = await res.json();
    if (data.success) {
      showToast('已删除');
      loadMessages();
    } else {
      showToast(data.error || '删除失败', true);
    }
  } catch (err) {
    showToast('删除失败', true);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
