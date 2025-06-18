import { createZodDto } from "nestjs-zod";
import { UpdateEventSchema } from "../schemas/update-event.schema";
import { ApiPropertyOptional } from "@nestjs/swagger";

// DTO para validación con Zod (solo para validación)
export class UpdateEventDto extends createZodDto(UpdateEventSchema) {}

// DTO para Swagger (solo para documentación)
export class UpdateEventSwaggerDto {
  @ApiPropertyOptional({ example: "Feria Artesanal Actualizada" })
  name?: string;

  @ApiPropertyOptional({ example: "Plaza Nueva" })
  location?: string;

  @ApiPropertyOptional({ example: "2025-07-02T10:00:00.000Z" })
  startDate?: Date;

  @ApiPropertyOptional({ example: "2025-07-06T18:00:00.000Z" })
  endDate?: Date;
}
