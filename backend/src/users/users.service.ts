import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateUserRolDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  usuario: true,
  nombre: true,
  rol: true,
  empresaId: true,
  createdAt: true,
  updatedAt: true,
  empresa: { select: { id: true, nombre: true } },
  profile: { select: { id: true, bio: true } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto, requesterId: number, requesterRol: string) {
    if (requesterId !== id && requesterRol !== 'admin') {
      throw new ForbiddenException('Solo puedes editar tu propio perfil');
    }

    await this.findOne(id);

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

  async updateRol(id: number, dto: UpdateUserRolDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { rol: dto.rol },
      select: USER_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.profile.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { message: `Usuario ${id} eliminado correctamente` };
  }

  async stats() {
    const [total, admins, porEmpresa] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { rol: 'admin' } }),
      this.prisma.user.groupBy({
        by: ['empresaId'],
        _count: { id: true },
      }),
    ]);

    return { total, admins, porEmpresa };
  }
}
