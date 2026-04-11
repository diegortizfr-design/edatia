import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ManagerJwtAuthGuard extends AuthGuard('manager-jwt') {}
