import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

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

@Module({
  imports: [AuthModule],
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
  ],
})
export class InventarioModule {}
