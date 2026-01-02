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
    }
  } catch (error) {
    console.error("Error al cargar configuración o datos de empresa:", error);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!API_URL) {
      showNotification("❌ Error: No se pudo cargar la configuración", "error");
      return;
    }

    const empresaData = {};
    new FormData(form).forEach((v, k) => (empresaData[k] = v));

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
