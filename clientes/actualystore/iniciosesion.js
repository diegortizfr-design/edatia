document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.querySelector("#usuario").value.trim();
    const contrasena = document.querySelector("#contrasena").value.trim();

    if (!usuario || !contrasena) {
      alert("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      // Cargar configuración del cliente
      const config = await fetch("./config.json").then(res => res.json());

      // Enviar solicitud al backend
      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Guardar datos en localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        localStorage.setItem("cliente", JSON.stringify(config));

        // Redirigir al dashboard
        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });
});
