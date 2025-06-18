import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginSwaggerDto } from './dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiBody({ type: LoginSwaggerDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, retorna JWT',
    schema: {
      example: {
        access_token: 'jwt_token_aqui',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
          createdAt: '2024-06-17T00:00:00.000Z'
        }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
