document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;

  var topCount = 0;
  var bottomCount = 0;

  function addTopParagraph(value) {
    var container = document.getElementById('topParagraphsContainer');
    var idx = topCount++;
    var div = document.createElement('div');
    div.className = 'form-group';
    div.style.marginBottom = '12px';
    div.innerHTML =
      '<div style="display:flex;gap:8px;align-items:start;">' +
        '<textarea class="form-textarea" id="topPara_' + idx + '" rows="3" placeholder="上段文字">' + (value || '') + '</textarea>' +
        '<button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()" style="padding:8px 12px;font-size:0.8rem;">删除</button>' +
      '</div>';
    container.appendChild(div);
  }

  function addBottomParagraph(value) {
    var container = document.getElementById('bottomParagraphsContainer');
    var idx = bottomCount++;
    var div = document.createElement('div');
    div.className = 'form-group';
    div.style.marginBottom = '12px';
    div.innerHTML =
      '<div style="display:flex;gap:8px;align-items:start;">' +
        '<textarea class="form-textarea" id="bottomPara_' + idx + '" rows="3" placeholder="下段文字">' + (value || '') + '</textarea>' +
        '<button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()" style="padding:8px 12px;font-size:0.8rem;">删除</button>' +
      '</div>';
    container.appendChild(div);
  }

  document.getElementById('addTopParagraph').addEventListener('click', function() { addTopParagraph(''); });
  document.getElementById('addBottomParagraph').addEventListener('click', function() { addBottomParagraph(''); });

  // Load current data
  try {
    var res = await fetch('/admin/api/about');
    var data = await res.json();

    document.getElementById('aboutHeading').value = data.heading || '';
    document.getElementById('contentTitle').value = data.contentTitle || '';

    // Top paragraphs
    var topParas = data.topParagraphs || [];
    topParas.forEach(function(p) { addTopParagraph(p); });
    if (topParas.length === 0) addTopParagraph('');

    // Bottom paragraphs
    var bottomParas = data.bottomParagraphs || [];
    bottomParas.forEach(function(p) { addBottomParagraph(p); });
    if (bottomParas.length === 0) addBottomParagraph('');

    // Mid image preview
    if (data.midImage) {
      var preview = document.getElementById('midImagePreview');
      preview.src = data.midImage;
      preview.style.display = 'block';
    }
  } catch (err) {
    showToast('加载失败', true);
  }

  // Image preview
  document.getElementById('midImageFile').addEventListener('change', function() {
    if (this.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var preview = document.getElementById('midImagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // Form submit
  document.getElementById('aboutForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Collect top paragraphs
    var topParas = [];
    var topTextareas = document.getElementById('topParagraphsContainer').querySelectorAll('textarea');
    topTextareas.forEach(function(ta) {
      var val = ta.value.trim();
      if (val) topParas.push(val);
    });

    // Collect bottom paragraphs
    var bottomParas = [];
    var bottomTextareas = document.getElementById('bottomParagraphsContainer').querySelectorAll('textarea');
    bottomTextareas.forEach(function(ta) {
      var val = ta.value.trim();
      if (val) bottomParas.push(val);
    });

    var formData = new FormData();
    formData.append('heading', document.getElementById('aboutHeading').value);
    formData.append('contentTitle', document.getElementById('contentTitle').value);
    formData.append('topParagraphs', JSON.stringify(topParas));
    formData.append('bottomParagraphs', JSON.stringify(bottomParas));

    var imageFile = document.getElementById('midImageFile').files[0];
    if (imageFile) {
      formData.append('midImage', imageFile);
    }

    try {
      var res = await fetch('/admin/api/about', {
        method: 'PUT',
        body: formData,
      });
      var data = await res.json();
      if (data.success) {
        showToast('关于页设置已保存');
      } else {
        showToast(data.error || '保存失败', true);
      }
    } catch (err) {
      showToast('保存失败', true);
    }
  });
});
