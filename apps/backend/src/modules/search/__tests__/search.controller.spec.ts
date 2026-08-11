import { SearchController } from '../search.controller';

describe('SearchController', () => {
  let controller: SearchController;
  let service: any;

  beforeEach(() => {
    service = {
      search: jest.fn(),
      searchBeneficiaries: jest.fn(),
    };
    controller = new SearchController(service);
  });

  const mockUser = { id: 'user-1', role: 'specialist', tenantId: 'tenant-1' } as any;

  describe('search', () => {
    it('should call service.search with correct params', async () => {
      const result = { beneficiaries: [], sessions: [] };
      service.search.mockResolvedValue(result);

      const response = await controller.search('ahmed', '10', 'tenant-1', mockUser);

      expect(service.search).toHaveBeenCalledWith('ahmed', 'tenant-1', mockUser, 10);
      expect(response).toEqual({ data: result });
    });

    it('should default limit to 5 when invalid', async () => {
      service.search.mockResolvedValue({});

      await controller.search('query', undefined as any, 'tenant-1', mockUser);

      expect(service.search).toHaveBeenCalledWith('query', 'tenant-1', mockUser, 5);
    });

    it('should parse limit from string', async () => {
      service.search.mockResolvedValue({});

      await controller.search('query', '20', 'tenant-1', mockUser);

      expect(service.search).toHaveBeenCalledWith('query', 'tenant-1', mockUser, 20);
    });
  });

  describe('searchBeneficiaries', () => {
    it('should call service.searchBeneficiaries', async () => {
      const result = [{ id: 'ben-1', name: 'Ahmed' }];
      service.searchBeneficiaries.mockResolvedValue(result);

      const response = await controller.searchBeneficiaries('ahmed', '10', 'tenant-1', mockUser);

      expect(service.searchBeneficiaries).toHaveBeenCalledWith('ahmed', 'tenant-1', mockUser, 10);
      expect(response).toEqual({ data: result });
    });

    it('should default limit to 10 when invalid', async () => {
      service.searchBeneficiaries.mockResolvedValue([]);

      await controller.searchBeneficiaries('query', undefined as any, 'tenant-1', mockUser);

      expect(service.searchBeneficiaries).toHaveBeenCalledWith('query', 'tenant-1', mockUser, 10);
    });
  });
});
