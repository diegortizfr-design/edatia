# Módulo de Soporte — Edatia
> Arquitectura completa del sistema de soporte SAC + Desarrollo
> Aplica para: Manager (manager.edatia.com) + ERP (erp.edatia.com)

---

## Flujo general

```
Cliente (ERP)
    │
    ├── Chat en tiempo real ──→ Agente IA ──→ ¿Puede resolver?
    │                                              │
    │                                         SÍ: responde y cierra
    │                                         NO: asigna al asesor SAC más libre
    │                                              │
    │                                         Asesor SAC (humano) ──→ ¿Puede resolver?
    │                                                                       │
    │                                                                  SÍ: resuelve y cierra
    │                                                                  NO: abre ticket → Desarrollo
    │
    └── Ticket directo ──→ NUEVO ──→ SAC ──→ DESARROLLO ──→ DEVUELTO ──→ RESUELTO ──→ CALIFICADO
```

---

## Estados del Ticket

| Estado | Descripción | Quién actúa |
|--------|-------------|-------------|
| `NUEVO` | Ticket recién creado por el cliente o por el asesor SAC | Sistema |
| `SAC` | Asignado a un asesor de servicio al cliente | Asesor SAC |
| `DESARROLLO` | Escalado al equipo de desarrollo | Desarrollador |
| `DEVUELTO` | Desarrollo lo devuelve a SAC con solución/aclaraciones | Asesor SAC |
| `RESUELTO` | SAC confirma solución al cliente | Sistema |
| `CALIFICADO` | Cliente califica el servicio (1-5 estrellas) | Cliente |

### Regla de calificación
- El cliente tiene **3 días** para calificar después de `RESUELTO`
- Si no califica en 3 días → el sistema asigna automáticamente **3 estrellas (promedio)**
- La calificación es visible para el Coordinador

---

## Canales de entrada

### Canal 1 — Chat en tiempo real (desde ERP)
```
1. Cliente abre chat en el ERP
2. Agente IA saluda: 
   "Hola, soy Diego de Edatia. ¿Me dices tu nombre y en qué puedo ayudarte hoy?"
3. Cliente escribe su consulta
4. IA analiza la consulta:
   - Si puede resolver → responde directamente
   - Si no puede → dice: "En unos minutos mi compañero [nombre del asesor asignado] te atenderá"
5. IA asigna al asesor SAC con menos chats activos en ese momento
6. Asesor SAC toma el chat y continúa la conversación en tiempo real
7. Si el asesor no puede resolver:
   a. Abre ticket documentando el caso (desde el Manager)
   b. Le dice al cliente: "Creé un ticket #XXX, puedes seguirlo en Soporte del ERP"
   c. El ticket queda en estado DESARROLLO
```

### Canal 2 — Ticket directo (desde ERP)
```
1. Cliente entra al módulo de Soporte del ERP
2. Crea el ticket con: asunto, descripción, prioridad, archivos adjuntos
3. El ticket entra en estado NUEVO
4. Sistema asigna automáticamente al asesor SAC más libre
5. El ticket sigue el flujo estándar: SAC → DESARROLLO → DEVUELTO → RESUELTO → CALIFICADO
```

---

## Modelo de datos

### Ticket
```prisma
model Ticket {
  id              Int      @id @default(autoincrement())
  numero          String   @unique  // TKT-2026-00001
  
  // ── Origen ────────────────────────────────────────
  origen          String   // CHAT, TICKET_DIRECTO
  clienteId       Int      // ClienteManager
  empresaId       Int?     // empresa del ERP (multi-tenant futuro)
  
  // ── Contenido ─────────────────────────────────────
  asunto          String
  descripcion     String
  prioridad       String   @default("MEDIA")  // BAJA, MEDIA, ALTA, CRITICA
  categoria       String?  // BUG, MEJORA, CONSULTA, CONFIGURACION
  
  // ── Estado y asignación ───────────────────────────
  estado          String   @default("NUEVO")
  asesorSacId     Int?     // Colaborador SAC asignado
  desarrolladorId Int?     // Colaborador DESARROLLO asignado
  
  // ── Calificación ──────────────────────────────────
  calificacion    Int?     // 1-5 estrellas
  calificadoAt    DateTime?
  calificacionAuto Boolean @default(false)  // true si fue automática
  
  // ── Fechas clave ──────────────────────────────────
  resueltoAt      DateTime?
  venceCalifAt    DateTime?  // resueltoAt + 3 días
  
  // ── Relaciones ────────────────────────────────────
  mensajes        TicketMensaje[]
  archivos        TicketArchivo[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model TicketMensaje {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  autor     String   // CLIENTE, SAC, DESARROLLO, IA
  autorId   Int?     // id del colaborador (null si es cliente o IA)
  contenido String
  interno   Boolean  @default(false)  // nota interna solo visible para el equipo
  createdAt DateTime @default(now())
}

model TicketArchivo {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  nombre    String
  url       String
  tipo      String   // image, pdf, etc.
  createdAt DateTime @default(now())
}
```

### Chat en tiempo real
```prisma
model ChatSesion {
  id          Int      @id @default(autoincrement())
  clienteId   Int
  asesorId    Int?     // null mientras lo maneja la IA
  estado      String   // ACTIVO_IA, ACTIVO_ASESOR, CERRADO, TRANSFERIDO_TICKET
  ticketId    Int?     // si se convirtió en ticket
  mensajes    ChatMensaje[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChatMensaje {
  id          Int      @id @default(autoincrement())
  sesionId    Int
  sesion      ChatSesion @relation(fields: [sesionId], references: [id])
  autor       String   // CLIENTE, IA, ASESOR
  autorId     Int?
  contenido   String
  createdAt   DateTime @default(now())
}
```

---

## Módulo OPERACIÓN — Vistas

### Sub-módulo SAC

**Vista: Mis Chats** `/operacion/sac/chats`
- Lista de chats activos asignados al asesor
- Indicador de chats en espera (sin asesor)
- Interfaz de chat en tiempo real (WebSocket)
- Botón "Crear ticket" dentro del chat

**Vista: Mis Tickets** `/operacion/sac/tickets`
- Lista de tickets asignados al asesor
- Filtros: estado, prioridad, fecha
- Ver detalle del ticket con hilo de mensajes
- Botón "Escalar a Desarrollo"
- Botón "Marcar como resuelto"

### Sub-módulo Desarrollo

**Vista: Mis Tickets de Desarrollo** `/operacion/desarrollo/tickets`
- Lista de tickets escalados al desarrollador
- Filtros: estado, prioridad, categoría (BUG, MEJORA, etc.)
- Ver detalle con hilo completo del caso
- Botón "Responder / Devolver a SAC"
- Botón "Marcar como resuelto desde desarrollo"

---

## Módulo COORDINACIÓN — Vistas

**Vista: Dashboard** `/coordinacion/dashboard`
- Métricas en tiempo real:
  - Tickets por estado (donut chart)
  - Tickets por asesor (quién tiene más carga)
  - Tiempo promedio de resolución
  - Calificación promedio del equipo
  - Chats activos en este momento

**Vista: Tickets** `/coordinacion/tickets`
- Vista completa de TODOS los tickets (no solo los propios)
- Puede reasignar tickets entre asesores o desarrolladores
- Filtros avanzados: asesor, estado, prioridad, fecha, calificación

**Vista: Equipo** `/coordinacion/equipo`
- Tabla de asesores SAC con métricas:
  - Tickets resueltos este mes
  - Tiempo promedio de respuesta
  - Calificación promedio
  - Chats activos ahora
- Tabla de desarrolladores con métricas:
  - Tickets resueltos
  - Bugs cerrados
  - Tareas completadas

**Vista: Reportes** `/coordinacion/reportes`
- Exportar reportes por período
- Histórico de calificaciones
- Tendencias de tickets por categoría

---

## Agente IA — Especificaciones

### Comportamiento
- Nombre visible al cliente: **"Diego de Edatia"** (o el nombre que se configure)
- Saludo inicial automático al abrir el chat
- Analiza la consulta del cliente con Claude API
- Base de conocimiento: FAQs, documentación del ERP, respuestas previas similares
- Si no puede resolver en **2 intercambios**: transfiere a asesor humano
- Mensaje de transferencia: *"En unos minutos [nombre del asesor] te atenderá"*

### Algoritmo de asignación de asesor
1. Busca asesores SAC con estado `ACTIVO` (online)
2. Ordena por número de chats activos (menor a mayor)
3. Asigna al primero de la lista
4. Si no hay asesores disponibles: pone en cola con tiempo estimado de espera

### Integración técnica
- **Claude API** (Anthropic) para el agente IA
- **WebSockets** (Socket.io) para chat en tiempo real
- **Sistema de colas** (Bull/Redis) para gestión de asignaciones
- **Notificaciones push** al asesor cuando se le asigna un chat

---

## Tecnología requerida

| Componente | Tecnología | Estado |
|------------|------------|--------|
| Chat en tiempo real | Socket.io (NestJS Gateway) | Por construir |
| Agente IA | Claude API (Anthropic) | Por construir |
| Cola de tickets | Bull + Redis | Por construir |
| Notificaciones | Socket.io events | Por construir |
| Timer calificación | Cron job NestJS | Por construir |

---

## Prioridad de construcción

### Fase 1 — Manager (próximo sprint)
1. Modelo de datos Ticket en schema.prisma
2. CRUD de tickets (backend)
3. Vista Tickets SAC en Operación (lista + detalle + cambio estado)
4. Vista Tickets Desarrollo en Operación
5. Vista Coordinación Dashboard (métricas básicas)
6. Vista Coordinación Tickets (vista global + reasignación)

### Fase 2 — Tiempo real
7. WebSocket Gateway (NestJS)
8. Vista Chat SAC en tiempo real
9. Integración agente IA (Claude API)

### Fase 3 — ERP
10. Módulo Soporte en ERP (crear ticket + seguimiento)
11. Chat desde ERP hacia el sistema
12. Sistema de calificación con timer automático

---

## Notas importantes

- El chat en tiempo real requiere **Redis** para Socket.io en múltiples instancias
- El agente IA necesita **ANTHROPIC_API_KEY** en el .env del backend
- La calificación automática de 3 estrellas se implementa con un **Cron job** de NestJS (`@Cron`)
- Los mensajes internos del ticket (notas entre asesor y desarrollador) NO son visibles para el cliente
- El número de ticket debe ser autoincremental con formato: `TKT-YYYY-NNNNN`
