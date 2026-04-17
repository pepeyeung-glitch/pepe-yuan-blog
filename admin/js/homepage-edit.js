document.addEventListener('DOMContentLoaded', async function() {
  if (!await checkAuth()) return;

  // Load current homepage data
  try {
    var res = await fetch('/admin/api/homepage');
    var data = await res.json();

    document.getElementById('heroTitle').value = data.title || '';
    document.getElementById('heroSubtitle').value = data.subtitle || '';
    document.getElementById('ctaText').value = data.ctaText || '';
    document.getElementById('ctaLink').value = data.ctaLink || '';

    if (data.heroImage) {
      var preview = document.getElementById('heroImagePreview');
      preview.src = data.heroImage;
      preview.style.display = 'block';
    }
  } catch (err) {
    showToast('加载失败', true);
  }

  // Image preview
  document.getElementById('heroImageFile').addEventListener('change', function() {
    if (this.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var preview = document.getElementById('heroImagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // Form submit
  document.getElementById('homepageForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var formData = new FormData();
    formData.append('title', document.getElementById('heroTitle').value);
    formData.append('subtitle', document.getElementById('heroSubtitle').value);
    formData.append('ctaText', document.getElementById('ctaText').value);
    formData.append('ctaLink', document.getElementById('ctaLink').value);

    var imageFile = document.getElementById('heroImageFile').files[0];
    if (imageFile) {
      formData.append('heroImage', imageFile);
    }

    try {
      var res = await fetch('/admin/api/homepage', {
        method: 'PUT',
        body: formData,
      });

      var data = await res.json();
      if (data.success) {
        showToast('首页设置已保存');
      } else {
        showToast(data.error || '保存失败', true);
      }
    } catch (err) {
      showToast('保存失败', true);
    }
  });
});
