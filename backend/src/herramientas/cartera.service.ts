import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { HerramientasPrismaService } from '../prisma/herramientas-prisma.service';
import { GuardarCarteraDto, RecuperarCarteraDto } from './dto/cartera.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CarteraService {
  private readonly logger = new Logger(CarteraService.name);

  constructor(private prisma: HerramientasPrismaService) {}

  private generarIdentificador(nombre: string, correo: string, password: string): string {
    const cleanName = nombre.trim().replace(/\s+/g, '_');
    const emailPrefix = correo.substring(0, 2).toLowerCase();
    const passPrefix = password.substring(0, 2).toLowerCase();
    return `${cleanName}_${emailPrefix}_${passPrefix}`;
  }

  async guardar(dto: GuardarCarteraDto) {
    const { nombre, correo, password, datosJson } = dto;
    const identificador = this.generarIdentificador(nombre, correo, password);

    let gestion = await this.prisma.gestionCarteraGratuita.findUnique({
      where: { identificador },
    });

    if (gestion) {
      // Validar password
      const isMatch = await bcrypt.compare(password, gestion.password);
      if (!isMatch) {
        throw new UnauthorizedException('Ya existe una gestión con ese nombre pero la contraseña no coincide.');
      }

      // Actualizar: Borrar facturas viejas y crear nuevas (Transacción)
      await this.prisma.$transaction(async (tx) => {
        await tx.facturaCarteraGratuita.deleteMany({
          where: { gestionId: gestion.id },
        });

        if (Array.isArray(datosJson) && datosJson.length > 0) {
          await tx.facturaCarteraGratuita.createMany({
            data: datosJson.map((item: any) => ({
              gestionId: gestion.id,
              nit: String(item.nit || ''),
              cliente: String(item.cliente || ''),
              ciudad: String(item.ciudad || ''),
              vendedor: String(item.vendedor || ''),
              terminoPago: String(item.terminoPago || ''),
              factura: String(item.factura || ''),
              fechaFactura: String(item.fechaFactura || ''),
              fechaVencimiento: String(item.fechaVencimiento || ''),
              valorFactura: Number(item.valorFactura || 0),
              pagoAbono: Number(item.pagoAbono || 0),
              responsable: String(item.responsable || ''),
              telefono: String(item.telefono || ''),
              fechaPago: String(item.fechaPago || ''),
              observacion1: String(item.observacion1 || ''),
              observacion2: String(item.observacion2 || ''),
            })),
          });
        }
      });

      this.logger.log(`Actualizada gestión: ${identificador} (${datosJson.length} filas)`);
      return gestion;
    } else {
      // Crear nueva gestión
      const hashedPassword = await bcrypt.hash(password, 10);
      
      return this.prisma.$transaction(async (tx) => {
        const newGestion = await tx.gestionCarteraGratuita.create({
          data: {
            nombre,
            correo,
            password: hashedPassword,
            identificador,
          },
        });

        if (Array.isArray(datosJson) && datosJson.length > 0) {
          await tx.facturaCarteraGratuita.createMany({
            data: datosJson.map((item: any) => ({
              gestionId: newGestion.id,
              nit: String(item.nit || ''),
              cliente: String(item.cliente || ''),
              ciudad: String(item.ciudad || ''),
              vendedor: String(item.vendedor || ''),
              terminoPago: String(item.terminoPago || ''),
              factura: String(item.factura || ''),
              fechaFactura: String(item.fechaFactura || ''),
              fechaVencimiento: String(item.fechaVencimiento || ''),
              valorFactura: Number(item.valorFactura || 0),
              pagoAbono: Number(item.pagoAbono || 0),
              responsable: String(item.responsable || ''),
              telefono: String(item.telefono || ''),
              fechaPago: String(item.fechaPago || ''),
              observacion1: String(item.observacion1 || ''),
              observacion2: String(item.observacion2 || ''),
            })),
          });
        }

        this.logger.log(`Creada nueva gestión: ${identificador} (${datosJson.length} filas)`);
        return newGestion;
      });
    }
  }

  async recuperar(dto: RecuperarCarteraDto) {
    const { nombre, correo, password } = dto;
    const identificador = this.generarIdentificador(nombre, correo, password);

    const gestion = await this.prisma.gestionCarteraGratuita.findUnique({
      where: { identificador },
      include: { facturas: true },
    });

    if (!gestion) {
      throw new UnauthorizedException('No se encontró ninguna gestión con esos datos.');
    }

    const isMatch = await bcrypt.compare(password, gestion.password);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    // Calcular días restantes (90 días)
    const diff = new Date().getTime() - gestion.createdAt.getTime();
    const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.max(0, 90 - daysPassed);

    return {
      datosJson: gestion.facturas,
      diasRestantes,
    };
  }
}
