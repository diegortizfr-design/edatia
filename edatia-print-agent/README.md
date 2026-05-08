# Edatia Print Agent

Este es el agente local de impresión para Edatia ERP. Permite que el sistema web facture e imprima tirillas físicas de forma instantánea y silenciosa en impresoras térmicas USB.

## ¿Por qué existe esto?
Los navegadores web (Chrome, Edge, Safari) bloquean el acceso directo a los puertos USB por seguridad. Este agente sirve como "puente" entre la web y el hardware físico de la caja registradora.

## Instalación (Para el cliente/restaurante)

1. Descargar e instalar [Node.js](https://nodejs.org/es/).
2. Abrir una terminal en esta carpeta.
3. Ejecutar: `npm install`
4. Ejecutar: `npm start`

## Uso
El agente debe permanecer abierto (consola negra) mientras el restaurante esté operando el POS. 
El ERP web se conectará automáticamente a `http://localhost:8080/print`.
