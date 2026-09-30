import { Module } from '@nestjs/common'
import { FixturesController } from './fixtures.controller.js'
import { FixturesService } from './fixtures.service.js'

@Module({
    controllers: [FixturesController],
    providers: [FixturesService]
})
export class FixturesModule {}
