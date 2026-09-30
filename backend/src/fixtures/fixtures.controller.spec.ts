import { Test, TestingModule } from '@nestjs/testing'
import { FixturesController } from './fixtures.controller.js'
import { FixturesService } from './fixtures.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('FixturesController', () => {
  let controller: FixturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixturesController],
      providers: [FixturesService, PrismaService],
    }).compile();

    controller = module.get<FixturesController>(FixturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
