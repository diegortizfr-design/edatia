document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formEmpresa");

  const API_URL = "https://api-erpod.onrender.com/actualystore/empresa";

  // 🔹 Cargar datos existentes
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data && data.success && data.empresa) {
      for (const campo in data.empresa) {
        if (document.getElementById(campo)) {
          document.getElementById(campo).value = data.empresa[campo] || "";
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar datos de empresa:", error);
  }

  // 🔹 Guardar cambios
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const empresaData = {};
    new FormData(form).forEach((v, k) => (empresaData[k] = v));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
