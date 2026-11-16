// Generador y Codificador estándar de Código de Barras Code 128 (Subconjunto B)
// 100% vectorial (SVG), sin dependencias externas, compatible con pistolas lectoras 1D/2D y BarTender.

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106
];

export function encodeCode128B(rawText: string): boolean[] {
  const text = (rawText || '').trim();
  if (!text) return [];

  // Start Code B es el índice 104
  const startCode = 104;
  const codes: number[] = [startCode];
  let checksum = startCode;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Para Code 128B, los caracteres van de ASCII 32 al 127
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(val);
    checksum += val * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  // Stop Code es 106
  codes.push(106);

  // Convertir cada código a módulos (true = barra negra, false = espacio blanco)
  const modules: boolean[] = [];

  // Zona de silencio inicial (quiet zone)
  for (let q = 0; q < 10; q++) modules.push(false);

  codes.forEach(codeIdx => {
    const pattern = CODE128_PATTERNS[codeIdx] || '212222';
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  });

  // Zona de silencio final (quiet zone)
  for (let q = 0; q < 10; q++) modules.push(false);

  return modules;
}

export interface BarcodeItemParaImprimir {
  id: string;
  productoId: number;
  varianteId?: number | null;
  nombreProducto: string;
  nombreVariante?: string;
  sku: string;
  codigoBarras: string;
  precio: number;
  stockActual: number;
  cantidadCopias: number;
  colorHex?: string;
  incluir: boolean;
}

/**
 * Componente React que dibuja un Código de Barras Code 128 puro en SVG
 */
export function Barcode128({
  value,
  height = 36,
  barWidth = 1.3,
  showText = true,
  className = '',
}: {
  value: string;
  height?: number;
  barWidth?: number;
  showText?: boolean;
  className?: string;
}) {
  const code = (value || '').trim();
  if (!code) return null;

  const modules = encodeCode128B(code);
  const totalWidth = modules.length * barWidth;

  // Agrupar módulos contiguos en rectángulos para un SVG súper liviano
  const rects: Array<{ x: number; width: number }> = [];
  let currentRun = 0;
  let startX = 0;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) {
      if (currentRun === 0) startX = i * barWidth;
      currentRun++;
    } else if (currentRun > 0) {
      rects.push({ x: startX, width: currentRun * barWidth });
      currentRun = 0;
    }
  }
  if (currentRun > 0) {
    rects.push({ x: startX, width: currentRun * barWidth });
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="block"
        shapeRendering="crispEdges"
      >
        <rect width={totalWidth} height={height} fill="#ffffff" />
        {rects.map((r, idx) => (
          <rect key={idx} x={r.x} y={0} width={r.width} height={height} fill="#000000" />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[9px] tracking-[2px] font-bold text-slate-800 mt-0.5">
          {code}
        </span>
      )}
    </div>
  );
}

/**
 * Descarga automática de archivo CSV compatible con la "Conexión a Base de Datos" de BarTender
 */
export function descargarCSVBarTender(
  nombreArchivo: string,
  items: Array<{
    producto: string;
    variante?: string;
    codigoBarras: string;
    referencia?: string;
    precio: number;
    cantidad: number;
  }>
) {
  const headers = ['Producto', 'Variante', 'Codigo_Barras', 'Referencia', 'Precio', 'Cantidad'];
  const rows = items.map(it => [
    `"${(it.producto || '').replace(/"/g, '""')}"`,
    `"${(it.variante || '').replace(/"/g, '""')}"`,
    `"${(it.codigoBarras || '').replace(/"/g, '""')}"`,
    `"${(it.referencia || '').replace(/"/g, '""')}"`,
    it.precio || 0,
    it.cantidad || 1,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
