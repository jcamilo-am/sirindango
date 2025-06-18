import { Module } from '@nestjs/common';
import { ArtisanService } from './artisans.service';
import { ArtisanController } from './artisans.controller';

@Module({
    providers: [ArtisanService],
    controllers: [ArtisanController]
})
export class ArtisanModule {}
