import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /roles
   * Returns all active roles for the authenticated user's company.
   */
  @Get()
  findAll(@Req() req: Request) {
    const empresaId: number = (req.user as any).empresaId;
    return this.rolesService.findAll(empresaId);
  }

  /**
   * POST /roles
   * Creates a new role for the authenticated user's company.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: Request, @Body() dto: CreateRolDto) {
    const empresaId: number = (req.user as any).empresaId;
    return this.rolesService.create(empresaId, dto);
  }

  /**
   * PATCH /roles/:id
   * Updates an existing role. Only roles belonging to the user's company
   * can be modified.
   */
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolDto,
  ) {
    const empresaId: number = (req.user as any).empresaId;
    return this.rolesService.update(id, empresaId, dto);
  }

  /**
   * DELETE /roles/:id
   * Soft-deletes a role by setting activo=false.
   * Only roles belonging to the user's company can be deleted.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const empresaId: number = (req.user as any).empresaId;
    return this.rolesService.remove(id, empresaId);
  }
}
