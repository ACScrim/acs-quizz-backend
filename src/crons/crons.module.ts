import { Module } from '@nestjs/common';
import { OpenTdbService } from './open-tdb.service';

@Module({
    providers: [OpenTdbService]
})
export class CronsModule {}
