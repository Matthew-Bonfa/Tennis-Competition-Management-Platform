import { Test, TestingModule } from '@nestjs/testing';
import { FormatsController } from './formats.controller.js';
import { FormatsService } from './formats.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('FormatsController', () => {
  let controller: FormatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormatsController],
      providers: [FormatsService, PrismaService]
    }).compile();

    controller = module.get<FormatsController>(FormatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
