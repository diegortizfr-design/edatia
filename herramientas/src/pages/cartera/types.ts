export interface CarteraItem {
  id: string;
  nit: string;
  fechaCreacionCliente: string;
  cliente: string;
  ciudad: string;
  vendedor: string;
  responsable: string;
  terminoPago: string; // días
  factura: string;
  fechaFactura: string; // YYYY-MM-DD
  fechaVencimiento: string;
  valorFactura: number;
  pagoAbono: number;
  contactos: string;
  telefono: string;
  fechaPago: string;
  observacion1: string;
  observacion2: string;
}

export const BUCKETS = [
  { label: '0 - 30 días', min: 0, max: 30 },
  { label: '31 - 60 días', min: 31, max: 60 },
  { label: '61 - 90 días', min: 61, max: 90 },
  { label: '91 días o más', min: 91, max: 999999 },
];

export const ALL_COLUMNS = [
  { id: 'nit', label: 'NIT' },
  { id: 'fechaCreacionCliente', label: 'Fecha Creación' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'terminoPago', label: 'Término' },
  { id: 'factura', label: 'Factura' },
  { id: 'fechaFactura', label: 'Fecha Fact.' },
  { id: 'fechaVencimiento', label: 'Vencimiento' },
  { id: 'bucket_0_30', label: '0 - 30 días' },
  { id: 'bucket_31_60', label: '31 - 60 días' },
  { id: 'bucket_61_90', label: '61 - 90 días' },
  { id: 'bucket_91_plus', label: '91 días o más' },
  { id: 'total', label: 'Total' },
  { id: 'dias_cartera', label: 'Días Cartera' },
  { id: 'dias_vencidos', label: 'Días Vencidos' },
  { id: 'responsable', label: 'Responsable' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'pago', label: 'Pago' },
  { id: 'fechaPago', label: 'Fecha Pago' },
  { id: 'observacion1', label: 'Obs 1' },
  { id: 'observacion2', label: 'Obs 2' },
];

// Helpers
export function calcularSaldo(valorFactura: number, pagoAbono: number) {
  return Number(valorFactura || 0) - Number(pagoAbono || 0);
}

export function getBucketValue(item: CarteraItem, bucket: { min: number; max: number }) {
  const saldo = calcularSaldo(item.valorFactura, item.pagoAbono);
  if (saldo <= 0) return 0;

  const hoy = new Date();
  const vencimiento = new Date(item.fechaVencimiento);
  const diffTime = hoy.getTime() - vencimiento.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= bucket.min && diffDays <= bucket.max) {
    return saldo;
  }
  return 0;
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}
