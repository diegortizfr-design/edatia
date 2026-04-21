/**
 * PUC — Plan Único de Cuentas de Colombia
 * Decreto 2650 de 1993 (adaptado para empresas comerciales bajo NIIF)
 * Incluye los niveles 1 (clase), 2 (grupo), 3 (cuenta), 4 (subcuenta)
 * más usados en empresas comerciales con facturación electrónica DIAN.
 */

export interface PucSeedItem {
  codigo: string
  nombre: string
  nivel: number
  codigoPadre?: string
  naturaleza: 'DEBITO' | 'CREDITO'
  tipo: string
}

export const PUC_SEED: PucSeedItem[] = [
  // ══════════════════════════════════════════
  // CLASE 1 — ACTIVO
  // ══════════════════════════════════════════
  { codigo: '1',    nombre: 'Activo',                           nivel: 1,                  naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '11',   nombre: 'Disponible',                        nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1105', nombre: 'Caja',                              nivel: 3, codigoPadre: '11',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '110505',nombre: 'Caja general',                     nivel: 4, codigoPadre: '1105', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '110510',nombre: 'Cajas menores',                    nivel: 4, codigoPadre: '1105', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '1110', nombre: 'Bancos',                            nivel: 3, codigoPadre: '11',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '111005',nombre: 'Bancos nacionales',                nivel: 4, codigoPadre: '1110', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '111010',nombre: 'Bancos del exterior',              nivel: 4, codigoPadre: '1110', naturaleza: 'DEBITO', tipo: 'ACTIVO' },

  { codigo: '12',   nombre: 'Inversiones',                       nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1205', nombre: 'Acciones',                          nivel: 3, codigoPadre: '12',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },

  { codigo: '13',   nombre: 'Deudores',                          nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1305', nombre: 'Clientes',                          nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '130505',nombre: 'Clientes nacionales',              nivel: 4, codigoPadre: '1305', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '130510',nombre: 'Clientes del exterior',            nivel: 4, codigoPadre: '1305', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '1320', nombre: 'Cuentas corrientes comerciales',    nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1330', nombre: 'Anticipos y avances',               nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '133005',nombre: 'Anticipos a proveedores',          nivel: 4, codigoPadre: '1330', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '133010',nombre: 'Anticipos a contratistas',         nivel: 4, codigoPadre: '1330', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '1335', nombre: 'Depósitos',                         nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1345', nombre: 'Ingresos por cobrar',               nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1355', nombre: 'Deudores varios',                   nivel: 3, codigoPadre: '13',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '135515',nombre: 'Retención en la fuente (saldo a favor)', nivel: 4, codigoPadre: '1355', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '135517',nombre: 'ReteIVA (saldo a favor)',          nivel: 4, codigoPadre: '1355', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '135518',nombre: 'ReteICA (saldo a favor)',          nivel: 4, codigoPadre: '1355', naturaleza: 'DEBITO', tipo: 'ACTIVO' },

  { codigo: '14',   nombre: 'Inventarios',                       nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1435', nombre: 'Mercancías no fabricadas por la empresa', nivel: 3, codigoPadre: '14', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '143505',nombre: 'Inventario de mercancías',         nivel: 4, codigoPadre: '1435', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '1455', nombre: 'Materiales, repuestos y accesorios',nivel: 3, codigoPadre: '14',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },

  { codigo: '15',   nombre: 'Propiedades, planta y equipo',      nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1516', nombre: 'Construcciones y edificaciones',    nivel: 3, codigoPadre: '15',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1520', nombre: 'Maquinaria y equipo',               nivel: 3, codigoPadre: '15',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1524', nombre: 'Equipo de oficina',                 nivel: 3, codigoPadre: '15',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1528', nombre: 'Equipo de computación y comunicación', nivel: 3, codigoPadre: '15', naturaleza: 'DEBITO', tipo: 'ACTIVO' },
  { codigo: '1540', nombre: 'Flota y equipo de transporte',      nivel: 3, codigoPadre: '15',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1592', nombre: 'Depreciación acumulada (CR)',       nivel: 3, codigoPadre: '15',naturaleza: 'CREDITO', tipo: 'ACTIVO' },

  { codigo: '16',   nombre: 'Intangibles',                       nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1605', nombre: 'Crédito mercantil',                 nivel: 3, codigoPadre: '16',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1635', nombre: 'Licencias',                         nivel: 3, codigoPadre: '16',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },

  { codigo: '17',   nombre: 'Diferidos',                         nivel: 2, codigoPadre: '1', naturaleza: 'DEBITO',  tipo: 'ACTIVO' },
  { codigo: '1705', nombre: 'Gastos pagados por anticipado',     nivel: 3, codigoPadre: '17',naturaleza: 'DEBITO',  tipo: 'ACTIVO' },

  // ══════════════════════════════════════════
  // CLASE 2 — PASIVO
  // ══════════════════════════════════════════
  { codigo: '2',    nombre: 'Pasivo',                            nivel: 1,                  naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '21',   nombre: 'Obligaciones financieras',          nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2105', nombre: 'Bancos nacionales',                 nivel: 3, codigoPadre: '21',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2110', nombre: 'Corporaciones financieras',         nivel: 3, codigoPadre: '21',naturaleza: 'CREDITO', tipo: 'PASIVO' },

  { codigo: '22',   nombre: 'Proveedores',                       nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2205', nombre: 'Proveedores nacionales',            nivel: 3, codigoPadre: '22',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '220505',nombre: 'Proveedores nacionales',           nivel: 4, codigoPadre: '2205', naturaleza: 'CREDITO', tipo: 'PASIVO' },

  { codigo: '23',   nombre: 'Cuentas por pagar',                 nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2335', nombre: 'Costos y gastos por pagar',         nivel: 3, codigoPadre: '23',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2360', nombre: 'Dividendos o participaciones por pagar', nivel: 3, codigoPadre: '23', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2365', nombre: 'Retención en la fuente',            nivel: 3, codigoPadre: '23',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236540',nombre: 'ReteFuente honorarios (11%)',      nivel: 4, codigoPadre: '2365', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236545',nombre: 'ReteFuente servicios (4%)',        nivel: 4, codigoPadre: '2365', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236560',nombre: 'ReteFuente compras (3.5%)',        nivel: 4, codigoPadre: '2365', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236570',nombre: 'ReteFuente arrendamientos (3.5%)',nivel: 4, codigoPadre: '2365', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2367', nombre: 'IVA retenido (ReteIVA)',            nivel: 3, codigoPadre: '23',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236705',nombre: 'ReteIVA por pagar (15% del IVA)', nivel: 4, codigoPadre: '2367', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2368', nombre: 'Impuesto de industria y comercio retenido (ReteICA)', nivel: 3, codigoPadre: '23', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '236805',nombre: 'ReteICA por pagar',                nivel: 4, codigoPadre: '2368', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2370', nombre: 'Retenciones y aportes de nómina',  nivel: 3, codigoPadre: '23',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2380', nombre: 'Acreedores varios',                 nivel: 3, codigoPadre: '23',naturaleza: 'CREDITO', tipo: 'PASIVO' },

  { codigo: '24',   nombre: 'Impuestos, gravámenes y tasas',     nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2404', nombre: 'Impuesto de renta y complementarios',nivel: 3, codigoPadre: '24',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2408', nombre: 'Impuesto sobre las ventas por pagar (IVA)', nivel: 3, codigoPadre: '24', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '240801',nombre: 'IVA generado 19%',                 nivel: 4, codigoPadre: '2408', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '240802',nombre: 'IVA generado 5%',                  nivel: 4, codigoPadre: '2408', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '240810',nombre: 'IVA descontable (compras)',        nivel: 4, codigoPadre: '2408', naturaleza: 'DEBITO',  tipo: 'PASIVO' },
  { codigo: '2412', nombre: 'Impuesto de industria y comercio',  nivel: 3, codigoPadre: '24',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2416', nombre: 'Impuesto predial unificado',        nivel: 3, codigoPadre: '24',naturaleza: 'CREDITO', tipo: 'PASIVO' },

  { codigo: '25',   nombre: 'Obligaciones laborales',            nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2505', nombre: 'Salarios por pagar',                nivel: 3, codigoPadre: '25',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2510', nombre: 'Cesantías consolidadas',            nivel: 3, codigoPadre: '25',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2515', nombre: 'Intereses sobre cesantías',         nivel: 3, codigoPadre: '25',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2520', nombre: 'Prima de servicios',                nivel: 3, codigoPadre: '25',naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2525', nombre: 'Vacaciones consolidadas',           nivel: 3, codigoPadre: '25',naturaleza: 'CREDITO', tipo: 'PASIVO' },

  { codigo: '26',   nombre: 'Pasivos estimados y provisiones',   nivel: 2, codigoPadre: '2', naturaleza: 'CREDITO', tipo: 'PASIVO' },
  { codigo: '2610', nombre: 'Para costos y gastos',              nivel: 3, codigoPadre: '26',naturaleza: 'CREDITO', tipo: 'PASIVO' },

  // ══════════════════════════════════════════
  // CLASE 3 — PATRIMONIO
  // ══════════════════════════════════════════
  { codigo: '3',    nombre: 'Patrimonio',                         nivel: 1,                  naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '31',   nombre: 'Capital social',                     nivel: 2, codigoPadre: '3', naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3105', nombre: 'Capital suscrito y pagado',          nivel: 3, codigoPadre: '31',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3115', nombre: 'Aportes sociales',                   nivel: 3, codigoPadre: '31',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '33',   nombre: 'Reservas',                           nivel: 2, codigoPadre: '3', naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3305', nombre: 'Reserva legal',                      nivel: 3, codigoPadre: '33',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3310', nombre: 'Reservas estatutarias',              nivel: 3, codigoPadre: '33',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '34',   nombre: 'Revalorización del patrimonio',      nivel: 2, codigoPadre: '3', naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '36',   nombre: 'Resultados del ejercicio',           nivel: 2, codigoPadre: '3', naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3605', nombre: 'Utilidad del ejercicio',             nivel: 3, codigoPadre: '36',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3610', nombre: 'Pérdida del ejercicio',              nivel: 3, codigoPadre: '36',naturaleza: 'DEBITO',  tipo: 'PATRIMONIO' },
  { codigo: '37',   nombre: 'Resultados de ejercicios anteriores',nivel: 2, codigoPadre: '3', naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3705', nombre: 'Utilidades acumuladas',              nivel: 3, codigoPadre: '37',naturaleza: 'CREDITO', tipo: 'PATRIMONIO' },
  { codigo: '3710', nombre: 'Pérdidas acumuladas',                nivel: 3, codigoPadre: '37',naturaleza: 'DEBITO',  tipo: 'PATRIMONIO' },

  // ══════════════════════════════════════════
  // CLASE 4 — INGRESOS
  // ══════════════════════════════════════════
  { codigo: '4',    nombre: 'Ingresos',                           nivel: 1,                  naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '41',   nombre: 'Ingresos operacionales',             nivel: 2, codigoPadre: '4', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '4135', nombre: 'Comercio al por mayor y al por menor',nivel: 3,codigoPadre: '41',naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '413505',nombre: 'Ingresos por ventas de mercancías', nivel: 4, codigoPadre: '4135', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '4155', nombre: 'Servicios',                          nivel: 3, codigoPadre: '41',naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '415505',nombre: 'Ingresos por servicios prestados',  nivel: 4, codigoPadre: '4155', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '4175', nombre: 'Devoluciones en ventas (DB)',        nivel: 3, codigoPadre: '41',naturaleza: 'DEBITO',  tipo: 'INGRESO' },
  { codigo: '417505',nombre: 'Devoluciones en ventas de mercancías',nivel: 4,codigoPadre: '4175', naturaleza: 'DEBITO', tipo: 'INGRESO' },
  { codigo: '4180', nombre: 'Descuentos comerciales en ventas (DB)',nivel: 3,codigoPadre: '41',naturaleza: 'DEBITO',  tipo: 'INGRESO' },
  { codigo: '418005',nombre: 'Descuentos en ventas',              nivel: 4, codigoPadre: '4180', naturaleza: 'DEBITO', tipo: 'INGRESO' },

  { codigo: '42',   nombre: 'Ingresos no operacionales',          nivel: 2, codigoPadre: '4', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '4210', nombre: 'Financieros',                        nivel: 3, codigoPadre: '42',naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '421005',nombre: 'Intereses',                         nivel: 4, codigoPadre: '4210', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '421010',nombre: 'Descuentos comerciales',            nivel: 4, codigoPadre: '4210', naturaleza: 'CREDITO', tipo: 'INGRESO' },
  { codigo: '4295', nombre: 'Ingresos diversos',                  nivel: 3, codigoPadre: '42',naturaleza: 'CREDITO', tipo: 'INGRESO' },

  // ══════════════════════════════════════════
  // CLASE 5 — GASTOS OPERACIONALES ADMÓN
  // ══════════════════════════════════════════
  { codigo: '5',    nombre: 'Gastos',                             nivel: 1,                  naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '51',   nombre: 'Gastos operacionales de administración',nivel: 2, codigoPadre: '5', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5105', nombre: 'Gastos de personal',                 nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '510506',nombre: 'Sueldos y salarios',                nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510530',nombre: 'Cesantías',                         nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510536',nombre: 'Prima de servicios',                nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510539',nombre: 'Vacaciones',                        nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510545',nombre: 'Aportes EPS patronal',              nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510548',nombre: 'Aportes fondo de pensiones patronal',nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510555',nombre: 'ARL',                               nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '510560',nombre: 'Caja de compensación',              nivel: 4, codigoPadre: '5105', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5110', nombre: 'Honorarios',                         nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '511005',nombre: 'Honorarios a personas naturales',   nivel: 4, codigoPadre: '5110', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '511010',nombre: 'Honorarios a personas jurídicas',   nivel: 4, codigoPadre: '5110', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5115', nombre: 'Impuestos',                          nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '511510',nombre: 'Industria y comercio',              nivel: 4, codigoPadre: '5115', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '511515',nombre: 'Predial unificado',                 nivel: 4, codigoPadre: '5115', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5120', nombre: 'Arrendamientos',                     nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '512005',nombre: 'Arrendamientos construcciones',     nivel: 4, codigoPadre: '5120', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5130', nombre: 'Seguros',                            nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5135', nombre: 'Servicios',                          nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '513530',nombre: 'Servicios de aseo y vigilancia',    nivel: 4, codigoPadre: '5135', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '513540',nombre: 'Servicios públicos',                nivel: 4, codigoPadre: '5135', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '513545',nombre: 'Procesamiento electrónico de datos',nivel: 4, codigoPadre: '5135', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '513595',nombre: 'Servicios diversos',                nivel: 4, codigoPadre: '5135', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5140', nombre: 'Gastos legales',                     nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5145', nombre: 'Mantenimiento y reparaciones',       nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5155', nombre: 'Gastos de viaje',                    nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5160', nombre: 'Depreciaciones',                     nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '516005',nombre: 'Construcciones y edificaciones',    nivel: 4, codigoPadre: '5160', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '516028',nombre: 'Equipo de computación',             nivel: 4, codigoPadre: '5160', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5165', nombre: 'Amortizaciones',                     nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5195', nombre: 'Gastos diversos',                    nivel: 3, codigoPadre: '51',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '519505',nombre: 'Elementos de aseo y cafetería',     nivel: 4, codigoPadre: '5195', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '519510',nombre: 'Útiles y papelería',                nivel: 4, codigoPadre: '5195', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '519520',nombre: 'Publicidad y propaganda',           nivel: 4, codigoPadre: '5195', naturaleza: 'DEBITO', tipo: 'GASTO' },

  // Gastos de ventas (clase 52)
  { codigo: '52',   nombre: 'Gastos operacionales de ventas',     nivel: 2, codigoPadre: '5', naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5205', nombre: 'Gastos de personal — ventas',        nivel: 3, codigoPadre: '52',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '520506',nombre: 'Sueldos y salarios — ventas',       nivel: 4, codigoPadre: '5205', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5210', nombre: 'Comisiones — ventas',                nivel: 3, codigoPadre: '52',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5220', nombre: 'Propaganda y publicidad',            nivel: 3, codigoPadre: '52',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5295', nombre: 'Gastos diversos — ventas',           nivel: 3, codigoPadre: '52',naturaleza: 'DEBITO',  tipo: 'GASTO' },

  // Gastos no operacionales (clase 53)
  { codigo: '53',   nombre: 'Gastos no operacionales',            nivel: 2, codigoPadre: '5', naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '5305', nombre: 'Financieros',                        nivel: 3, codigoPadre: '53',naturaleza: 'DEBITO',  tipo: 'GASTO' },
  { codigo: '530505',nombre: 'Gastos bancarios',                  nivel: 4, codigoPadre: '5305', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '530510',nombre: 'Intereses bancarios',               nivel: 4, codigoPadre: '5305', naturaleza: 'DEBITO', tipo: 'GASTO' },
  { codigo: '5395', nombre: 'Gastos extraordinarios',             nivel: 3, codigoPadre: '53',naturaleza: 'DEBITO',  tipo: 'GASTO' },

  // ══════════════════════════════════════════
  // CLASE 6 — COSTOS DE VENTAS
  // ══════════════════════════════════════════
  { codigo: '6',    nombre: 'Costo de ventas y prestación de servicios',nivel: 1, naturaleza: 'DEBITO', tipo: 'COSTO' },
  { codigo: '61',   nombre: 'Costos de ventas',                   nivel: 2, codigoPadre: '6', naturaleza: 'DEBITO',  tipo: 'COSTO' },
  { codigo: '6135', nombre: 'Comercio al por mayor y al por menor',nivel: 3, codigoPadre: '61',naturaleza: 'DEBITO',  tipo: 'COSTO' },
  { codigo: '613505',nombre: 'Costo de mercancías vendidas',      nivel: 4, codigoPadre: '6135', naturaleza: 'DEBITO', tipo: 'COSTO' },
  { codigo: '6175', nombre: 'Devoluciones en compras (CR)',       nivel: 3, codigoPadre: '61',naturaleza: 'CREDITO', tipo: 'COSTO' },
  { codigo: '617505',nombre: 'Devoluciones en compras de mercancías',nivel: 4,codigoPadre: '6175', naturaleza: 'CREDITO', tipo: 'COSTO' },
  { codigo: '6180', nombre: 'Descuentos en compras (CR)',         nivel: 3, codigoPadre: '61',naturaleza: 'CREDITO', tipo: 'COSTO' },
]
