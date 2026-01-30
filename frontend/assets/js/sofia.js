/**
 * sofIA - Tu Asistente Personal ERPod
 */
class SofiaAssistant {
    constructor() {
        this.container = document.getElementById('sofia-dashboard-widget');
        this.greetingEl = document.getElementById('sofia-greeting');
        this.token = localStorage.getItem('token');
        this.userData = JSON.parse(localStorage.getItem('user'));

        if (this.container) {
            this.init();
        }
    }

    async init() {
        this.updateGreeting(`Hola <strong>${this.userData.usuario || 'Diego'}</strong>, soy <strong>sofIA</strong>. Estoy analizando tu agenda...`);

        // Simular carga de datos (luego se conectará a la tabla eventos_sofia)
        setTimeout(() => {
            this.showDailySummary();
        }, 1500);

        this.container.addEventListener('click', () => this.openAgenda());
    }

    updateGreeting(html) {
        if (this.greetingEl) {
            this.greetingEl.innerHTML = html;
        }
    }

    async showDailySummary() {
        // En el futuro, esto hará un fetch a /sofia/eventos/hoy
        const resumen = {
            citas: 2,
            cobros: 1,
            pendientes: 3
        };

        if (resumen.citas > 0 || resumen.cobros > 0) {
            this.updateGreeting(`<strong>${this.userData.usuario || 'Diego'}</strong>, hoy tienes <strong>${resumen.citas} citas</strong> y <strong>${resumen.cobros} cobros</strong> pendientes. ¿Quieres verlos?`);
        } else {
            this.updateGreeting(`¡Todo al día! No tienes compromisos urgentes para hoy.`);
        }
    }

    openAgenda() {
        // Redirigir a la página completa de sofIA
        window.location.href = 'sofia.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sofIA = new SofiaAssistant();
});
