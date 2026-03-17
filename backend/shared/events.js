// backend/shared/events.js
const EventEmitter = require('events');

/**
 * Bus de eventos interno para el ERP
 * Permite la comunicación desacoplada entre módulos
 */
class ERPodEventEmitter extends EventEmitter {}
const eventBus = new ERPodEventEmitter();

// Logging de eventos en modo desarrollo
if (process.env.NODE_ENV === 'development') {
    eventBus.on('newListener', (eventName) => {
        console.debug(`[EventBus] Nuevo suscriptor para el evento: ${eventName}`);
    });
}

module.exports = eventBus;
