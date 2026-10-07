import { Test, TestingModule } from '@nestjs/testing';
import { FormatsService } from './formats.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('FormatsService', () => {
  let service: FormatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormatsService, PrismaService],
    }).compile();

    service = module.get<FormatsService>(FormatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
