import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateUserRolDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  usuario: true,
  nombre: true,
  rol: true,
  empresaId: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  empresa: { select: { id: true, nombre: true } },
  profile: { select: { id: true, bio: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, empresaId: number) {
    const usuarioClean = dto.usuario.trim();
    const emailClean = dto.email ? dto.email.trim() : null;

    // Verificar si el usuario ya existe en esta empresa
    const exists = await this.prisma.user.findFirst({
      where: {
        empresaId,
        OR: [
          { usuario: usuarioClean },
          ...(emailClean ? [{ email: emailClean }] : []),
        ],
      },
    });

    if (exists) {
      throw new BadRequestException('El nombre de usuario o correo ya está en uso en esta empresa');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: emailClean,
        usuario: usuarioClean,
        nombre: dto.nombre,
        password: hashedPassword,
        rol: dto.rol || 'user',
        empresaId,
      },
      select: USER_SELECT,
    });
  }

  async findAll(empresaId: number) {
    return this.prisma.user.findMany({
      where: { empresaId },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, empresaId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado en tu empresa`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto, requesterId: number, requesterRol: string, empresaId: number) {
    if (requesterId !== id && requesterRol !== 'admin') {
      throw new ForbiddenException('Solo puedes editar tu propio perfil o necesitas ser administrador');
    }

    // Verificar pertenencia a la empresa
    const currentUser = await this.findOne(id, empresaId);

    const updateData: Record<string, unknown> = {};
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre;

    if (dto.usuario !== undefined) {
      const usuarioClean = dto.usuario.trim();
      const exists = await this.prisma.user.findFirst({
        where: {
          empresaId,
          usuario: usuarioClean,
          id: { not: id },
        },
      });
      if (exists) {
        throw new BadRequestException('El nombre de usuario ya está en uso en esta empresa');
      }
      updateData.usuario = usuarioClean;
    }

    if (dto.email !== undefined) {
      const emailClean = dto.email ? dto.email.trim() : null;
      if (emailClean) {
        const existsEmail = await this.prisma.user.findFirst({
          where: {
            empresaId,
            email: emailClean,
            id: { not: id },
          },
        });
        if (existsEmail) {
          throw new BadRequestException('El correo ya está en uso en esta empresa');
        }
      }
      updateData.email = emailClean;
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    // Rol y Activo solo pueden ser modificados por un administrador
    if (requesterRol === 'admin') {
      if (dto.rol !== undefined) {
        if (currentUser.rol === 'admin' && dto.rol !== 'admin') {
          const adminCount = await this.prisma.user.count({
            where: { empresaId, rol: 'admin', activo: true, id: { not: id } },
          });
          if (adminCount === 0) {
            throw new BadRequestException('No puedes quitar el rol de administrador al único administrador activo de la empresa');
          }
        }
        updateData.rol = dto.rol;
      }

      if (dto.activo !== undefined) {
        if (currentUser.rol === 'admin' && dto.activo === false) {
          const adminCount = await this.prisma.user.count({
            where: { empresaId, rol: 'admin', activo: true, id: { not: id } },
          });
          if (adminCount === 0) {
            throw new BadRequestException('No puedes desactivar al único administrador activo de la empresa');
          }
        }
        updateData.activo = dto.activo;
      }
    }

    if (dto.bio !== undefined) {
      await this.prisma.profile.upsert({
        where: { userId: id },
        create: { userId: id, bio: dto.bio },
        update: { bio: dto.bio },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }

  async updateRol(id: number, dto: UpdateUserRolDto, empresaId: number) {
    await this.findOne(id, empresaId);
    return this.prisma.user.update({
      where: { id },
      data: { rol: dto.rol },
      select: USER_SELECT,
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    await this.prisma.profile.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { message: `Usuario ${id} eliminado correctamente` };
  }

  async stats(empresaId: number) {
    const [total, admins] = await Promise.all([
      this.prisma.user.count({ where: { empresaId } }),
      this.prisma.user.count({ where: { empresaId, rol: 'admin' } }),
    ]);

    return { total, admins };
  }
}
