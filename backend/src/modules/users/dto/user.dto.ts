import { createZodDto } from "nestjs-zod";
import { UserSchema } from "../schemas/user.schema";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


// DTO para validación con Zod (solo para validación)
export class UserDto extends createZodDto(UserSchema) {}

// DTO para Swagger (solo para documentación)
export class UserSwaggerDto {
  @ApiProperty({ example: "john_doe" })
  username: string;

  @ApiProperty({ example: "password123" })
  password: string;

  @ApiPropertyOptional({ example: "admin" })
  role?: string;
}
