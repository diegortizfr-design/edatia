# Módulo Terceros — ERP Edatia
> Referencia técnica y funcional para la construcción del módulo de Terceros/Clientes en el ERP (erp.edatia.com)
> Este módulo será la base para la facturación electrónica DIAN (Colombia)

---

## Contexto

En el **Manager** (manager.edatia.com) ya existe un módulo de Clientes que almacena los datos principales del cliente del SaaS Edatia.

En el **ERP** (erp.edatia.com), el módulo de Terceros es más completo porque debe:
- Ser la fuente de datos para emitir facturas electrónicas válidas ante la DIAN
- Manejar clientes, proveedores y empleados como "terceros"
- Integrarse con la DIAN mediante API o proveedor tecnológico habilitado

---

## Datos obligatorios del cliente para facturación electrónica DIAN

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| Nombre o razón social | ✅ | |
| Tipo de documento (NIT, CC, CE, Pasaporte) | ✅ | |
| Número de identificación | ✅ | |
| Dígito de verificación | ✅ si es NIT | |
| Correo electrónico | ✅ | Envío automático de factura |
| Dirección | Recomendado | |
| Ciudad / municipio | Recomendado | |
| País | Recomendado | |
| Régimen tributario | ✅ | Responsable IVA / No responsable / SIMPLE |
| Responsabilidades fiscales (RUT) | ✅ | |

---

## Datos obligatorios del emisor (empresa del cliente ERP)

| Campo | Notas |
|-------|-------|
| NIT con dígito de verificación | |
| Razón social | |
| Dirección | |
| Ciudad | |
| Responsabilidades fiscales (RUT) | |
| Numeración autorizada DIAN | Resolución de facturación |
| Certificado digital | Para firma del XML |
| Ambiente DIAN | Habilitación (pruebas) o Producción |

---

## Datos obligatorios de la factura electrónica

| Campo | Notas |
|-------|-------|
| Número de factura | Prefijo + consecutivo (según resolución DIAN) |
| Fecha y hora de emisión | Zona horaria Colombia (UTC-5) |
| Tipo de documento | Factura venta, Nota crédito, Nota débito |
| Descripción del producto/servicio | |
| Cantidad | |
| Valor unitario | |
| Descuentos (si aplica) | |
| Impuestos (IVA 19%, IVA 5%, INC, etc.) | |
| Total de la factura | |
| Medio de pago | Efectivo, transferencia, crédito, etc. |
| Condiciones de pago | Contado / crédito + días |

---

## Requisitos técnicos DIAN

### Formato XML UBL 2.1
- El documento debe generarse en formato XML según el estándar UBL 2.1
- Adaptado a la especificación técnica DIAN (Anexo técnico versión vigente)

### Firma digital
- El XML debe firmarse con certificado digital emitido por entidad certificadora habilitada por la DIAN
- Algoritmo: RSA-SHA256

### CUFE (Código Único de Factura Electrónica)
- Generado a partir de: número factura + fecha + hora + valor + impuestos + NIT emisor + NIT receptor + clave técnica DIAN
- Algoritmo: SHA-384

### Flujo de validación DIAN
```
Generar XML → Firmar digitalmente → Enviar a DIAN (web service) → 
Recibir respuesta (aprobado/rechazado) → 
Si aprobado: generar PDF (representación gráfica) → 
Enviar XML + PDF al correo del cliente
```

### Contingencia
- Si la DIAN no responde en tiempo, se puede emitir en contingencia
- Debe reportarse a la DIAN al recuperar conexión

---

## Proveedores tecnológicos habilitados (alternativa a integración directa)

En lugar de integrar directamente con los web services de la DIAN, Edatia puede usar un proveedor habilitado:

| Proveedor | API REST | Costo aprox. |
|-----------|----------|-------------|
| Siigo | Sí | Por documento |
| Alegra | Sí | Por documento |
| Facture.co | Sí | Por documento |
| Bizagi (Carvajal) | Sí | Por volumen |
| API DIAN directa | Soap/REST | Sin costo por doc |

**Recomendación:** Iniciar con un proveedor como Alegra o Facture.co para acelerar el desarrollo. Migrar a integración directa DIAN cuando haya mayor volumen.

---

## Modelo de datos — Módulo Terceros ERP

### Entidad: Tercero
```prisma
model Tercero {
  id                    Int      @id @default(autoincrement())
  empresaId             Int      // multi-tenant: a qué empresa pertenece
  
  // ── Identificación ──────────────────────────────
  tipoTercero           String   // CLIENTE, PROVEEDOR, EMPLEADO, OTRO
  tipoPersona           String   // NATURAL, JURIDICA
  tipoDocumento         String   // NIT, CC, CE, PASAPORTE, TI, RUT
  numeroIdentificacion  String
  digitoVerificacion    String?  // solo para NIT
  nombreRazonSocial     String
  nombreComercial       String?
  
  // ── Ubicación ────────────────────────────────────
  pais                  String   @default("CO")
  departamento          String?
  ciudad                String?
  direccion             String?
  codigoPostal          String?
  
  // ── Contacto ─────────────────────────────────────
  email                 String?  // OBLIGATORIO para fe
  telefonoPrincipal     String?
  telefonoAlternativo   String?
  paginaWeb             String?
  
  // ── Tributario (DIAN) ────────────────────────────
  regimenTributario     String?  // RESPONSABLE_IVA, NO_RESPONSABLE, SIMPLE
  responsabilidadFiscal String[] // códigos RUT: O-13, O-15, O-23, etc.
  actividadEconomica    String?  // código CIIU
  granContribuyente     Boolean  @default(false)
  autorretenedor        Boolean  @default(false)
  agenteRetencion       Boolean  @default(false)
  
  // ── Comercial ────────────────────────────────────
  tipoCliente           String?  // MINORISTA, MAYORISTA, VIP, DISTRIBUIDOR
  listaPreciosId        Int?
  cupoCredito           Decimal? @db.Decimal(14, 2)
  condicionesPago       String?  // CONTADO, CREDITO_15, CREDITO_30, CREDITO_60
  vendedorId            Int?     // userId del vendedor asignado
  
  // ── Financiero ───────────────────────────────────
  banco                 String?
  tipoCuenta            String?  // AHORROS, CORRIENTE
  numeroCuenta          String?
  
  // ── Interno ──────────────────────────────────────
  segmento              String?
  observaciones         String?
  activo                Boolean  @default(true)
  
  empresa               Empresa  @relation(fields: [empresaId], references: [id])
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([empresaId, tipoDocumento, numeroIdentificacion])
}
```

---

## Regímenes tributarios Colombia

| Código | Nombre |
|--------|--------|
| `RESPONSABLE_IVA` | Responsable del IVA (grande contribuyente o régimen común) |
| `NO_RESPONSABLE` | No responsable del IVA (antes régimen simplificado) |
| `SIMPLE` | Régimen Simple de Tributación |
| `ESPECIAL` | Régimen Especial (fundaciones, cooperativas, etc.) |

## Responsabilidades fiscales RUT (más comunes)

| Código | Descripción |
|--------|-------------|
| O-13 | Gran contribuyente |
| O-15 | Autorretenedor |
| O-23 | Agente de retención en la fuente |
| O-47 | Régimen Simple de Tributación |
| R-99-PN | No aplica – Otros |

## Tipos de documento válidos DIAN

| Código | Documento |
|--------|-----------|
| 11 | Registro civil |
| 12 | Tarjeta de identidad |
| 13 | Cédula de ciudadanía (CC) |
| 21 | Tarjeta de extranjería |
| 22 | Cédula de extranjería (CE) |
| 31 | NIT |
| 41 | Pasaporte |
| 42 | Documento de identificación extranjero |
| 50 | NIT de otro país |

---

## Requisitos funcionales del módulo

### Vista lista de terceros
- Filtros: tipo tercero, estado, ciudad, régimen tributario
- Búsqueda por nombre, NIT, ciudad
- Exportar a Excel/CSV
- Indicador visual si tiene datos completos para facturar

### Vista formulario tercero
- Pestañas: Identificación | Contacto | Tributario | Comercial | Financiero
- Validación en tiempo real (formato NIT, email, CUIL)
- Dígito de verificación calculado automáticamente para NIT
- Estado del formulario: completo / incompleto para facturación electrónica

### Validaciones obligatorias para facturación electrónica
- [ ] Nombre / razón social
- [ ] Tipo de documento
- [ ] Número de identificación
- [ ] Email
- [ ] Régimen tributario
- [ ] Al menos una dirección

---

## Integración con módulo de Ventas / Facturación

```
Tercero → Factura Electrónica
  |
  ├── nombreRazonSocial     → nombre en factura
  ├── tipoDocumento         → tipo doc en XML DIAN
  ├── numeroIdentificacion  → NIT/CC en XML
  ├── digitoVerificacion    → DV en XML
  ├── email                 → envío automático
  ├── regimenTributario     → tipo operación tributaria
  ├── responsabilidadFiscal → códigos en XML
  └── condicionesPago       → medio/forma de pago en XML
```

---

## Prioridad de construcción

1. **Fase 1** — CRUD básico de terceros (tipo cliente) con campos obligatorios DIAN
2. **Fase 2** — Validación de completitud del perfil tributario
3. **Fase 3** — Integración con facturación electrónica (proveedor tecnológico)
4. **Fase 4** — Integración directa DIAN (largo plazo)

---

## Notas de implementación

- El módulo de Terceros del ERP es **multi-tenant**: cada empresa ve solo sus terceros
- El modelo `Tercero` se une a `Empresa` (un tercero existe dentro del contexto de una empresa)
- Los datos del cliente en el **Manager** son independientes de los del **ERP** — son dos bases de datos conceptualmente diferentes (una es del SaaS, la otra es de los datos operacionales del cliente del SaaS)
- Cuando un cliente del Manager activa el módulo de Ventas, se crea la estructura multi-tenant para que ese cliente pueda gestionar sus propios terceros en el ERP
