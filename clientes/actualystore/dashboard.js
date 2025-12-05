document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const cliente = JSON.parse(localStorage.getItem("cliente"));

  if (!token || !usuario || !cliente) {
    window.location.href = "iniciosesion.html";
    return;
  }

  // Personalizar visual
  document.querySelector(".user-name strong").textContent = usuario.nombre;
  document.querySelector(".logo-box img").src = cliente.logo;
  document.querySelector(".logo-box h2").textContent = cliente.nombre;

  // Cargar modulos dinamicos
  const dashboard = document.querySelector(".dashboard");
  dashboard.innerHTML = "";

  cliente.modulos.forEach(mod => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <i class="fas fa-${mod === "compras" ? "shopping-cart" :
                       mod === "inventario" ? "boxes" :
                       mod === "facturacion" ? "file-invoice-dollar" :
                       "chart-line"}"></i>
      <h3>${mod.charAt(0).toUpperCase() + mod.slice(1)}</h3>
      <p>Gestiona el módulo de ${mod}.</p>
    `;
    dashboard.appendChild(div);
  });

  // Cierre de sesión
  document.querySelector(".btn-logout").addEventListener("click", () => {
    if (confirm("¿Deseas cerrar sesión?")) {
      localStorage.clear();
      window.location.href = "iniciosesion.html";
    }
  });
});
