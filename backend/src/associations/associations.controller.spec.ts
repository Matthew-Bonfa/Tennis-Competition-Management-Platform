import { Test, TestingModule } from '@nestjs/testing';
import { AssociationsController } from './associations.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AssociationsController', () => {
  let controller: AssociationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssociationsController, PrismaService],
    }).compile();

    controller = module.get<AssociationsController>(AssociationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
