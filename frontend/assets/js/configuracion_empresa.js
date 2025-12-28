document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formEmpresa");
  let API_URL = "";

  // 🔹 Cargar configuración y datos existentes
  try {
    // 1. Cargar config.json para obtener la URL del backend
    const configRes = await fetch("../../assets/config.json");
    const config = await configRes.json();
    API_URL = `${config.apiUrl}/empresa`;

    // 2. Cargar datos de la empresa
    const res = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Asegurar envío de token si es necesario
      }
    });

    // Si la respuesta es 401/403, redirigir a login (opcional, pero buena práctica)
    if (res.status === 401) {
      window.location.href = '../../modules/auth/login.html';
      return;
    }

    const data = await res.json();

    if (data && data.success && data.empresa) {
      for (const campo in data.empresa) {
        if (document.getElementById(campo)) {
          document.getElementById(campo).value = data.empresa[campo] || "";
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar configuración o datos de empresa:", error);
  }

  // 🔹 Guardar cambios
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!API_URL) {
      alert("❌ Error: No se pudo cargar la configuración del servidor.");
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
        alert("✅ Datos de empresa guardados correctamente.");
      } else {
        alert("⚠️ Error al guardar: " + result.message);
      }
    } catch (error) {
      alert("❌ Error de conexión con el servidor.");
      console.error(error);
    }
  });
});
