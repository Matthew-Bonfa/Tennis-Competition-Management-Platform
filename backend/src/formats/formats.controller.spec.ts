import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FormatsController } from './formats.controller.js';
import { FormatsService } from './formats.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFormatDto } from './dto/create-format.dto.js';

// The controller only forwards to the service, so the service is mocked and
// the tests check the call and the returned value, not any real database work
type MockedFormatsService = {
  findAll: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

describe('FormatsController', () => {
  let controller: FormatsController;
  let service: MockedFormatsService;

  // A format as the service returns it from findOne/create
  const formatDetail = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Single, Single, Double',
    minPlayers: 2,
    maxPlayers: 4,
    minAge: null,
    maxAge: null,
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAtGames: 6,
    finalSetMatchTiebreak: true,
    pointsPerRubber: 1,
    pointsPerMatchWin: 0,
    forfeitScoreline: '6-0 6-0',
    winnerDeterminedBy: 'rubbers_then_sets',
    minCourts: 1,
    rubbers: [
      { rubberNumber: 1, rubberType: 'singles' },
      { rubberNumber: 2, rubberType: 'singles' },
      { rubberNumber: 3, rubberType: 'doubles' },
    ],
    permittedGenders: ['boys', 'open'],
  };

  const createFormatDto: CreateFormatDto = {
    minPlayers: 2,
    maxPlayers: 4,
    setsToWin: 2,
    gamesPerSet: 6,
    tiebreakAtGames: 6,
    winnerDeterminedBy: 'rubbers_then_sets',
    minCourts: 1,
    permittedGenders: ['boys', 'open'],
    rubbers: ['singles', 'singles', 'doubles'],
  };

  beforeEach(async () => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormatsController],
      providers: [FormatsService, PrismaService],
    })
      .overrideProvider(FormatsService)
      .useValue(service)
      .compile();

    controller = module.get<FormatsController>(FormatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the summary list the service produced', async () => {
      const summaries = [
        { id: formatDetail.id, name: formatDetail.name },
        { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'Double, Double' },
      ];
      service.findAll.mockResolvedValue(summaries);

      await expect(controller.findAll()).resolves.toEqual(summaries);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('passes the id straight through to the service', async () => {
      service.findOne.mockResolvedValue(formatDetail);

      await expect(controller.findOne(formatDetail.id)).resolves.toEqual(
        formatDetail,
      );
      expect(service.findOne).toHaveBeenCalledWith(formatDetail.id);
    });

    it('lets a NotFoundException from the service through', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException(`Format ${formatDetail.id} not found`),
      );

      await expect(controller.findOne(formatDetail.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('passes the dto to the service and returns the created format', async () => {
      service.create.mockResolvedValue(formatDetail);

      await expect(controller.create(createFormatDto)).resolves.toEqual(
        formatDetail,
      );
      expect(service.create).toHaveBeenCalledWith(createFormatDto);
    });

    it('lets a BadRequestException from the service through', async () => {
      service.create.mockRejectedValue(
        new BadRequestException('maxPlayers cannot be less than minPlayers'),
      );

      await expect(controller.create(createFormatDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
