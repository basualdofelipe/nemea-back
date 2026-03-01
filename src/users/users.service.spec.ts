import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/types/role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'admin@nemea.com',
    name: 'Admin Nemea',
    pictureUrl: null,
    googleId: null,
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findActiveByEmail', () => {
    it('should return an active user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findActiveByEmail('admin@nemea.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@nemea.com', isActive: true },
      });
    });

    it('should return null for nonexistent email', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveByEmail('nonexistent@email.com');

      expect(result).toBeNull();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@email.com', isActive: true },
      });
    });

    it('should return null for deactivated user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveByEmail('deactivated@email.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user and return it', async () => {
      const dto = { email: 'new@user.com', role: Role.USER, name: 'New User' };
      const createdUser = { ...mockUser, ...dto, id: 2 };
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toEqual(createdUser);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null for nonexistent id', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('deactivate', () => {
    it('should set is_active to false', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.deactivate(1);

      expect(repository.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });

  describe('activate', () => {
    it('should set is_active to true', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.activate(1);

      expect(repository.update).toHaveBeenCalledWith(1, { isActive: true });
    });
  });

  describe('updateGoogleProfile', () => {
    it('should update google profile data', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateGoogleProfile(1, {
        name: 'Google Name',
        pictureUrl: 'https://example.com/pic.jpg',
        googleId: '123456',
      });

      expect(repository.update).toHaveBeenCalledWith(1, {
        name: 'Google Name',
        pictureUrl: 'https://example.com/pic.jpg',
        googleId: '123456',
      });
    });
  });

  describe('remove', () => {
    it('should hard delete a user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });
  });
});
