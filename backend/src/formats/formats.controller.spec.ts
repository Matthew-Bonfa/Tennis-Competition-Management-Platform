import { Test, TestingModule } from '@nestjs/testing';
import { FormatsController } from './formats.controller.js';

describe('FormatsController', () => {
  let controller: FormatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormatsController],
    }).compile();

    controller = module.get<FormatsController>(FormatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
