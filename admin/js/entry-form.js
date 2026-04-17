var editId = null;
var tags = [];
var cropper = null;
var croppedBlob = null;
var originalImageDataUrl = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;

  var params = new URLSearchParams(window.location.search);
  editId = params.get('id');

  if (editId) {
    document.getElementById('pageTitle').textContent = '编辑故事';
    await loadEntry(editId);
  }

  initTagInput();
  initImageUpload();
  initCropper();
  initAI();

  document.getElementById('entryForm').addEventListener('submit', handleSubmit);
});

async function loadEntry(id) {
  try {
    var res = await fetch('/admin/api/entries?limit=100');
    var data = await res.json();
    var entry = data.entries.find(function(e) { return e.id === id; });
    if (!entry) return;

    document.getElementById('title').value = entry.title || '';
    document.getElementById('date').value = entry.date ? entry.date.split('T')[0] : '';
    document.getElementById('location').value = entry.location || '';
    document.getElementById('category').value = entry.category || 'travel';
    document.getElementById('story').value = entry.story || '';

    if (entry.tags) {
      tags = entry.tags.slice();
      renderTags();
    }

    if (entry.image) {
      var preview = document.getElementById('imagePreview');
      preview.src = entry.image;
      preview.style.display = 'block';

      // Fetch existing image as dataURL so it can be cropped
      fetch(entry.image)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
          var reader = new FileReader();
          reader.onload = function(e) {
            originalImageDataUrl = e.target.result;
            document.getElementById('recropBtn').style.display = 'inline-flex';
          };
          reader.readAsDataURL(blob);
        });
    }
  } catch (err) {
    showToast('加载失败', true);
  }
}

function initTagInput() {
  var input = document.getElementById('tagInput');
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var val = input.value.trim();
      if (val && !tags.includes(val)) {
        tags.push(val);
        renderTags();
      }
      input.value = '';
    }
  });
}

function renderTags() {
  var wrap = document.getElementById('tagWrap');
  var input = document.getElementById('tagInput');
  wrap.querySelectorAll('.tag-item').forEach(function(el) { el.remove(); });

  tags.forEach(function(tag, i) {
    var el = document.createElement('span');
    el.className = 'tag-item';
    el.innerHTML = tag + '<button type="button" onclick="removeTag(' + i + ')">&times;</button>';
    wrap.insertBefore(el, input);
  });
}

function removeTag(index) {
  tags.splice(index, 1);
  renderTags();
}

// --- Image Upload + Crop ---

function initImageUpload() {
  var fileInput = document.getElementById('imageFile');

  fileInput.addEventListener('change', function() {
    if (!fileInput.files[0]) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      originalImageDataUrl = e.target.result;
      openCropModal(originalImageDataUrl);
    };
    reader.readAsDataURL(fileInput.files[0]);
  });

  // "裁剪" button
  document.getElementById('recropBtn').addEventListener('click', function() {
    if (originalImageDataUrl) {
      openCropModal(originalImageDataUrl);
    }
  });

  // "复原" button – restore to original uploaded image
  document.getElementById('restoreBtn').addEventListener('click', function() {
    if (originalImageDataUrl) {
      croppedBlob = null;
      var preview = document.getElementById('imagePreview');
      preview.src = originalImageDataUrl;
      document.getElementById('restoreBtn').style.display = 'none';
      showToast('已复原到原始图片');
    }
  });
}

function initCropper() {
  // Ratio buttons
  document.querySelectorAll('.crop-ratio').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.crop-ratio').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (cropper) {
        var ratio = parseFloat(btn.dataset.ratio);
        cropper.setAspectRatio(ratio === 0 ? NaN : ratio);
      }
    });
  });

  // Cancel
  document.getElementById('cropCancel').addEventListener('click', function() {
    closeCropModal();
  });

  // Confirm
  document.getElementById('cropConfirm').addEventListener('click', function() {
    if (!cropper) return;

    var canvas = cropper.getCroppedCanvas({
      maxWidth: 2000,
      maxHeight: 2000,
      imageSmoothingQuality: 'high',
    });

    canvas.toBlob(function(blob) {
      croppedBlob = blob;

      // Show preview
      var preview = document.getElementById('imagePreview');
      preview.src = URL.createObjectURL(blob);
      preview.style.display = 'block';
      document.getElementById('recropBtn').style.display = 'inline-flex';
      document.getElementById('restoreBtn').style.display = 'inline-flex';

      closeCropModal();
      showToast('图片已裁剪');
    }, 'image/jpeg', 0.92);
  });
}

function openCropModal(imageSrc) {
  var modal = document.getElementById('cropModal');
  var cropImage = document.getElementById('cropImage');

  // Destroy previous cropper
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  cropImage.src = imageSrc;
  modal.classList.add('open');

  // Reset ratio buttons
  document.querySelectorAll('.crop-ratio').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.crop-ratio[data-ratio="0"]').classList.add('active');

  // Init cropper after image loads
  cropImage.onload = function() {
    cropper = new Cropper(cropImage, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      background: true,
    });
  };
}

function closeCropModal() {
  var modal = document.getElementById('cropModal');
  modal.classList.remove('open');

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

// --- AI ---

function initAI() {
  document.getElementById('aiGenBtn').addEventListener('click', async function() {
    var btn = this;
    btn.textContent = '生成中...';
    btn.disabled = true;

    try {
      var res = await fetch('/admin/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: document.getElementById('date').value,
          location: document.getElementById('location').value,
          tags: tags,
        }),
      });

      var data = await res.json();
      if (data.generatedStory) {
        document.getElementById('story').value = data.generatedStory;
        showToast('故事已生成');
      } else {
        showToast('生成失败', true);
      }
    } catch (err) {
      showToast('生成失败', true);
    }

    btn.textContent = 'AI 生成故事';
    btn.disabled = false;
  });
}

// --- Submit ---

async function handleSubmit(e) {
  e.preventDefault();

  var formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('story', document.getElementById('story').value);
  formData.append('date', document.getElementById('date').value);
  formData.append('location', document.getElementById('location').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('tags', JSON.stringify(tags));

  // Use cropped blob if available, otherwise use original file
  if (croppedBlob) {
    formData.append('image', croppedBlob, 'cropped.jpg');
  } else {
    var imageFile = document.getElementById('imageFile').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }
  }

  try {
    var url = editId ? '/admin/api/entries/' + editId : '/admin/api/entries';
    var method = editId ? 'PUT' : 'POST';

    var res = await fetch(url, { method: method, body: formData });
    var data = await res.json();

    if (data.success) {
      showToast(editId ? '已更新' : '已创建');
      setTimeout(function() { location.href = '/admin/entries.html'; }, 1000);
    } else {
      showToast(data.error || '保存失败', true);
    }
  } catch (err) {
    showToast('保存失败', true);
  }
}
