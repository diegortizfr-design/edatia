import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { TercerosService } from './terceros.service'
import { CreateTerceroDto, UpdateTerceroDto } from './dto/tercero.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { GetUser, JwtPayload } from '../../common/decorators/get-user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('terceros')
export class TercerosController {
  constructor(private readonly svc: TercerosService) {}

  @Get()
  findAll(@GetUser() u: JwtPayload, @Query('q') q?: string) {
    return this.svc.findAll(u.empresaId!, q)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.findOne(id, u.empresaId!)
  }

  @Post()
  create(@Body() dto: CreateTerceroDto, @GetUser() u: JwtPayload) {
    return this.svc.create(dto, u.empresaId!)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTerceroDto, @GetUser() u: JwtPayload) {
    return this.svc.update(id, dto, u.empresaId!)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() u: JwtPayload) {
    return this.svc.remove(id, u.empresaId!)
  }
}
