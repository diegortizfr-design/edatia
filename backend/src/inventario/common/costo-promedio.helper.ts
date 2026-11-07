/**
 * Utilidad contable y de inventario para el cálculo blindado del Costo Promedio Ponderado (CPP)
 * Conforme a NIIF para Pymes / NIC 2 (Inventarios).
 */

export async function calcularNuevoCPP(
  tx: any,
  params: {
    productoId: number;
    empresaId: number;
    cantNueva: number;
    costoUnitario: number;
  },
): Promise<{ nuevoCPP: number; cantTotalGlobal: number }> {
  const { productoId, empresaId, cantNueva, costoUnitario } = params;

  const producto = await tx.producto.findUnique({
    where: { id: productoId },
    select: { id: true, costoPromedio: true },
  });
  const cppAnterior = Number(producto?.costoPromedio ?? 0);

  // 1. Sumar el stock actual de TODAS las bodegas de la empresa para este producto (multibodega)
  const stocks = await tx.stock.findMany({
    where: { productoId, empresaId },
    select: { cantidad: true },
  });
  const stockGlobalActual = stocks.reduce(
    (acc: number, s: any) => acc + Number(s.cantidad || 0),
    0,
  );

  // 2. Si el stock global previo era <= 0, no arrastrar ponderación matemática negativa (distorsión).
  // La nueva compra establece el nuevo costo promedio base.
  const stockPrevio = Math.max(0, stockGlobalActual);
  const cantTotal = stockPrevio + cantNueva;

  let nuevoCPP = costoUnitario;
  if (cantTotal > 0 && stockPrevio > 0) {
    nuevoCPP = ((stockPrevio * cppAnterior) + (cantNueva * costoUnitario)) / cantTotal;
  }

  // Redondear a 4 decimales según especificación Decimal(14,4)
  nuevoCPP = Number(nuevoCPP.toFixed(4));

  return { nuevoCPP, cantTotalGlobal: cantTotal };
}
