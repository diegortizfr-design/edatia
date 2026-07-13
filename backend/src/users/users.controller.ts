import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserRolDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtPayload } from '../common/decorators/get-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario dentro de la empresa' })
  @ApiResponse({ status: 201, description: 'Usuario creado con éxito' })
  create(
    @Body() dto: CreateUserDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.create(dto, user.empresaId!);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(@GetUser() user: JwtPayload) {
    return this.usersService.findAll(user.empresaId!);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de usuarios' })
  stats(@GetUser() user: JwtPayload) {
    return this.usersService.stats(user.empresaId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.findOne(id, user.empresaId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar nombre, bio o contraseña del usuario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, dto, user.sub, user.rol, user.empresaId!);
  }

  @Patch(':id/rol')
  @ApiOperation({ summary: 'Cambiar rol de usuario' })
  updateRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRolDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.updateRol(id, dto, user.empresaId!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.remove(id, user.empresaId!);
  }
}
