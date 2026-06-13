import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';

import { CategoriasController } from './categorias/categorias.controller';
import { CategoriasService } from './categorias/categorias.service';
import { MarcasController } from './marcas/marcas.controller';
import { MarcasService } from './marcas/marcas.service';
import { UnidadesMedidaController } from './unidades-medida/unidades-medida.controller';
import { UnidadesMedidaService } from './unidades-medida/unidades-medida.service';
import { ProductosController } from './productos/productos.controller';
import { ProductosService } from './productos/productos.service';
import { BodegasController } from './bodegas/bodegas.controller';
import { BodegasService } from './bodegas/bodegas.service';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { MovimientosController } from './movimientos/movimientos.controller';
import { MovimientosService } from './movimientos/movimientos.service';
import { InvDashboardController } from './dashboard/inv-dashboard.controller';
import { InvDashboardService } from './dashboard/inv-dashboard.service';
import { ProveedoresController } from './proveedores/proveedores.controller';
import { ProveedoresService } from './proveedores/proveedores.service';
import { OrdenesCompraController } from './ordenes-compra/ordenes-compra.controller';
import { OrdenesCompraService } from './ordenes-compra/ordenes-compra.service';
import { ReportesController } from './reportes/reportes.controller';
import { ReportesService } from './reportes/reportes.service';
import { LotesController } from './lotes/lotes.controller';
import { LotesService } from './lotes/lotes.service';
import { SerialesController } from './seriales/seriales.controller';
import { SerialesService } from './seriales/seriales.service';
import { VariantesController } from './variantes/variantes.controller';
import { VariantesService } from './variantes/variantes.service';
import { FacturasCompraController } from './facturas-compra/facturas-compra.controller';
import { FacturasCompraService } from './facturas-compra/facturas-compra.service';

// ── Nuevos Maestros ─────────────────────────────────
import { SubgruposProductoController } from './subgrupos-producto/subgrupos-producto.controller';
import { SubgruposProductoService } from './subgrupos-producto/subgrupos-producto.service';
import { ColoresProductoController } from './colores-producto/colores-producto.controller';
import { ColoresProductoService } from './colores-producto/colores-producto.service';
import { TallasProductoController } from './tallas-producto/tallas-producto.controller';
import { TallasProductoService } from './tallas-producto/tallas-producto.service';
import { ClasificacionesContablesController } from './clasificaciones-contables/clasificaciones-contables.controller';
import { ClasificacionesContablesService } from './clasificaciones-contables/clasificaciones-contables.service';
import { TagsProductoController } from './tags-producto/tags-producto.controller';
import { TagsProductoService } from './tags-producto/tags-producto.service';

@Module({
  imports: [AuthModule, ContabilidadModule],
  controllers: [
    CategoriasController,
    MarcasController,
    UnidadesMedidaController,
    ProductosController,
    BodegasController,
    StockController,
    MovimientosController,
    InvDashboardController,
    ProveedoresController,
    OrdenesCompraController,
    ReportesController,
    LotesController,
    SerialesController,
    VariantesController,
    FacturasCompraController,
    SubgruposProductoController,
    ColoresProductoController,
    TallasProductoController,
    ClasificacionesContablesController,
    TagsProductoController,
  ],
  providers: [
    CategoriasService,
    MarcasService,
    UnidadesMedidaService,
    ProductosService,
    BodegasService,
    StockService,
    MovimientosService,
    InvDashboardService,
    ProveedoresService,
    OrdenesCompraService,
    ReportesService,
    LotesService,
    SerialesService,
    VariantesService,
    FacturasCompraService,
    SubgruposProductoService,
    ColoresProductoService,
    TallasProductoService,
    ClasificacionesContablesService,
    TagsProductoService,
  ],
  exports: [
    MovimientosService, 
    ProductosService, 
    StockService,
    SubgruposProductoService,
    ColoresProductoService,
    TallasProductoService,
    ClasificacionesContablesService,
    TagsProductoService,
  ],
})
export class InventarioModule {}
