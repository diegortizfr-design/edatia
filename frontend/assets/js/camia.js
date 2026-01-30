/**
 * camIA - Tu Asistente Personal ERPod
 */
class CamiaAssistant {
    constructor() {
        this.container = document.getElementById('camia-dashboard-widget');
        this.greetingEl = document.getElementById('camia-greeting');
        this.token = localStorage.getItem('token');
        this.userData = JSON.parse(localStorage.getItem('user'));

        if (this.container) {
            this.init();
        }
    }

    async init() {
        this.updateGreeting(`Hola <strong>${this.userData.usuario || 'Diego'}</strong>, soy <strong>camIA</strong>. Estoy analizando tu agenda...`);

        await this.showDailySummary();

        this.container.addEventListener('click', () => this.openAgenda());
    }

    updateGreeting(html) {
        if (this.greetingEl) {
            this.greetingEl.innerHTML = html;
        }
    }

    async showDailySummary() {
        try {
            const response = await fetch('/api/camia/resumen', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();

            if (data.success) {
                const { resumen } = data;
                const totalEventos = resumen.eventos.reduce((acc, curr) => acc + curr.total, 0);

                if (totalEventos > 0 || resumen.facturasVencidas > 0) {
                    let msg = `<strong>${this.userData.usuario || 'Diego'}</strong>, hoy tienes `;
                    if (totalEventos > 0) msg += `<strong>${totalEventos} compromisos</strong> `;
                    if (resumen.facturasVencidas > 0) msg += `${totalEventos > 0 ? 'y ' : ''}<strong>${resumen.facturasVencidas} facturas vencidas</strong>.`;

                    this.updateGreeting(msg + " ¿Quieres verlos?");
                } else {
                    this.updateGreeting(`¡Todo al día! No tienes compromisos urgentes para hoy.`);
                }
            }
        } catch (error) {
            console.error("camIA Error:", error);
            this.updateGreeting(`¡Hola! Ten un excelente día.`);
        }
    }

    openAgenda() {
        // Redirigir a la página completa de camIA
        window.location.href = 'camia.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.camIA = new CamiaAssistant();
});
