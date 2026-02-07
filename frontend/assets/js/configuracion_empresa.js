document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formEmpresa");
  let API_URL = "";

  // 🔹 Cargar configuración y datos existentes
  try {
    const configRes = await fetch("/frontend/assets/config.json");
    const config = await configRes.json();
    API_URL = `${config.apiUrl}/empresa`;

    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.status === 401) {
      window.location.href = '/frontend/modules/auth/login.html';
      return;
    }

    const data = await res.json();

    if (data && data.success && data.empresa) {
      const emp = data.empresa;
      for (const campo in emp) {
        const el = document.getElementById(campo);
        if (el) el.value = emp[campo] || "";
      }

      // Mapeo manual para campos que no coinciden (DB -> HTML ID)
      if (document.getElementById('correo')) document.getElementById('correo').value = emp.email || "";
      if (document.getElementById('web')) document.getElementById('web').value = emp.sitio_web || "";

      // Cargar configuración de inventario (JSON)
      if (emp.config_inventario) {
        const conf = typeof emp.config_inventario === 'string'
          ? JSON.parse(emp.config_inventario)
          : emp.config_inventario;

        if (conf.duplicados) {
          if (document.getElementById('dup_nombre')) document.getElementById('dup_nombre').checked = !!conf.duplicados.nombre;
          if (document.getElementById('dup_codigo')) document.getElementById('dup_codigo').checked = !!conf.duplicados.codigo;
          if (document.getElementById('dup_referencia')) document.getElementById('dup_referencia').checked = !!conf.duplicados.referencia_fabrica;
          if (document.getElementById('dup_categoria')) document.getElementById('dup_categoria').checked = !!conf.duplicados.categoria;
        }
      }
    }
    // Load logo if exists
    if (emp.logo_url) {
      const preview = document.getElementById('logo_preview');
      const placeholder = document.getElementById('logo_placeholder');
      const deleteBtn = document.getElementById('btn_delete_logo');

      preview.src = emp.logo_url;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      deleteBtn.style.display = 'block';
      document.getElementById('logo_url').value = emp.logo_url;
    }

  } catch (error) {
    console.error("Error al cargar configuración o datos de empresa:", error);
  }

  // --- LOGO UPLOAD LOGIC ---
  const logoInput = document.getElementById('logo_input');
  if (logoInput) {
    logoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const btn = document.querySelector('label[for="logo_input"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
      btn.style.pointerEvents = 'none';

      try {
        const formData = new FormData();
        formData.append('image', file);

        // Construct Upload URL: /api/empresa -> /api/upload
        const uploadUrl = API_URL.replace('/empresa', '/upload');

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          document.getElementById('logo_url').value = data.url;
          document.getElementById('logo_preview').src = data.url;
          document.getElementById('logo_preview').style.display = 'block';
          document.getElementById('logo_placeholder').style.display = 'none';
          document.getElementById('btn_delete_logo').style.display = 'block';
          showNotification('Logo subido correctamente', 'success');
        } else {
          showNotification('Error: ' + data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        showNotification('Error al subir logo', 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.style.pointerEvents = 'auto';
      }
    });
  }

  const btnDeleteLogo = document.getElementById('btn_delete_logo');
  if (btnDeleteLogo) {
    btnDeleteLogo.addEventListener('click', () => {
      document.getElementById('logo_url').value = '';
      document.getElementById('logo_preview').src = '';
      document.getElementById('logo_preview').style.display = 'none';
      document.getElementById('logo_placeholder').style.display = 'block';
      btnDeleteLogo.style.display = 'none';
      logoInput.value = '';
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      const invalidInput = form.querySelector(':invalid');
      if (invalidInput) {
        // Check if invalid input is in the hidden tab
        const generalTab = document.getElementById('tab-general');
        if (generalTab.contains(invalidInput) && generalTab.style.display === 'none') {
          // Switch to general tab
          switchTab('general');
          showNotification("⚠️ Complete los campos obligatorios en la pestaña General", "warning");
        } else {
          showNotification("⚠️ Complete los campos obligatorios", "warning");
        }
        invalidInput.focus();
      }
      return;
    }

    if (!API_URL) {
      showNotification("❌ Error: No se pudo cargar la configuración", "error");
      return;
    }

    const empresaData = {};
    const formData = new FormData(form);

    // Basic fields
    const keys = ['tipo_figura', 'nombre_fiscal', 'nombre_comercial', 'nit', 'dv', 'direccion', 'telefono', 'correo', 'web', 'estado', 'logo_url'];
    keys.forEach(k => empresaData[k] = formData.get(k));

    // Inventory Config Construction
    const configInventario = {
      duplicados: {
        nombre: document.getElementById('dup_nombre').checked,
        codigo: document.getElementById('dup_codigo').checked,
        referencia_fabrica: document.getElementById('dup_referencia').checked,
        categoria: document.getElementById('dup_categoria').checked
      }
    };
    empresaData.config_inventario = configInventario;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(empresaData),
      });

      const result = await response.json();
      if (result.success) {
        showNotification("✅ Datos guardados correctamente", "success");
      } else {
        showNotification("⚠️ Error: " + result.message, "error");
      }
    } catch (error) {
      showNotification("❌ Error de comunicación", "error");
      console.error(error);
    }
  });
});
