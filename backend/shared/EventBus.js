// backend/shared/EventBus.js
const { EventEmitter } = require('events');

/**
 * EventBus Wrapper para ERPod SaaS
 * Permite cambiar el driver de mensajería sin tocar la lógica de negocio.
 */
class EventBus {
    constructor() {
        this.driver = new LocalDriver();
    }

    setDriver(driver) {
        this.driver = driver;
    }

    /**
     * Publica un evento
     * @param {string} eventName 
     * @param {object} payload 
     */
    publish(eventName, payload) {
        console.debug(`[EventBus] Publishing: ${eventName}`);
        this.driver.emit(eventName, payload);
    }

    /**
     * Se suscribe a un evento
     * @param {string} eventName 
     * @param {function} callback 
     */
    subscribe(eventName, callback) {
        this.driver.on(eventName, callback);
    }
}

class LocalDriver extends EventEmitter {}

// Singleton instance
const bus = new EventBus();
module.exports = bus;
