import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManagerAuthService } from './manager-auth.service';
import { ManagerLoginDto } from './dto/manager-login.dto';
import { ManagerJwtAuthGuard } from './manager-jwt-auth.guard';
import { ManagerJwtPayload } from './manager-jwt.strategy';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const GetManagerUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ManagerJwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: ManagerJwtPayload }>();
    return request.user;
  },
);

@ApiTags('Manager Auth')
@Controller('manager/auth')
export class ManagerAuthController {
  constructor(private readonly managerAuthService: ManagerAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de colaborador Edatia Manager' })
  login(@Body() dto: ManagerLoginDto) {
    return this.managerAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(ManagerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del colaborador autenticado' })
  me(@GetManagerUser() user: ManagerJwtPayload) {
    return this.managerAuthService.me(user.sub);
  }
}
