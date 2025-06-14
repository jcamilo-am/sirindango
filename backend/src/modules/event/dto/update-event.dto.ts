import { createZodDto } from "nestjs-zod";
import { UpdateEventSchema } from "../schemas/update-event.schema";

export class UpdateEventDto extends createZodDto(UpdateEventSchema) {}
