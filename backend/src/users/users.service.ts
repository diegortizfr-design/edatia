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
    await this.findOne(id, empresaId);

    const updateData: Record<string, unknown> = {};
    if (dto.nombre) updateData.nombre = dto.nombre;
    if (dto.password) updateData.password = await bcrypt.hash(dto.password, 12);

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
