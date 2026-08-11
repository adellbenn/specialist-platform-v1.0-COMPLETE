import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';

function mockConfig(overrides: Record<string, any> = {}) {
  return {
    get: jest.fn().mockImplementation((key: string, defaultVal?: any) => {
      const map: Record<string, any> = {
        CLAMAV_HOST: '',
        CLAMAV_PORT: 3310,
        ...overrides,
      };
      return map[key] ?? defaultVal;
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

jest.mock('net', () => {
  const handlers: Record<string, (...args: any[]) => void> = {};
  const socket = Object.assign(new EventEmitter(), {
    write: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn(),
  });
  const origOn = socket.on.bind(socket);
  socket.on = jest.fn((event: string, cb: any) => {
    handlers[event] = cb;
    return socket;
  }) as any;

  return {
    createConnection: jest.fn(() => socket),
    _socket: socket,
    _handlers: handlers,
  };
});

import { VirusScannerService } from '../virus-scanner.service';
import * as net from 'net';

const netMock = net as any;

describe('VirusScannerService', () => {
  describe('when disabled (no CLAMAV_HOST)', () => {
    let service: VirusScannerService;

    beforeEach(() => {
      service = new VirusScannerService(mockConfig());
    });

    it('isAvailable returns false', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('scanBuffer returns { clean: true }', async () => {
      const result = await service.scanBuffer(Buffer.from('test'), 'test.txt');
      expect(result).toEqual({ clean: true });
    });
  });

  describe('when enabled', () => {
    let service: VirusScannerService;

    beforeEach(() => {
      jest.clearAllMocks();
      netMock._socket.write.mockClear();
      netMock._socket.end.mockClear();
      netMock._socket.destroy.mockClear();
      Object.keys(netMock._handlers).forEach((k) => delete netMock._handlers[k]);
      service = new VirusScannerService(mockConfig({ CLAMAV_HOST: '127.0.0.1' }));
    });

    it('isAvailable returns true', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('returns clean: true on OK response', async () => {
      const promise = service.scanBuffer(Buffer.from('data'), 'file.txt');
      await new Promise((r) => setTimeout(r, 0));
      netMock._handlers['connect']();
      netMock._handlers['data'](Buffer.from('OK'));
      const result = await promise;
      expect(result).toEqual({ clean: true });
    });

    it('returns clean: false with virus name on FOUND response', async () => {
      const promise = service.scanBuffer(Buffer.from('data'), 'file.txt');
      await new Promise((r) => setTimeout(r, 0));
      netMock._handlers['connect']();
      netMock._handlers['data'](Buffer.from('stream: EICAR-Test-Signature FOUND'));
      const result = await promise;
      expect(result.clean).toBe(false);
      expect(result.virus).toBe('EICAR-Test-Signature');
    });

    it('returns clean: false with "unknown" when virus name not extractable', async () => {
      const promise = service.scanBuffer(Buffer.from('data'), 'file.txt');
      await new Promise((r) => setTimeout(r, 0));
      netMock._handlers['connect']();
      netMock._handlers['data'](Buffer.from('FOUND'));
      const result = await promise;
      expect(result.clean).toBe(false);
      expect(result.virus).toBe('unknown');
    });

    it('returns fail-open on socket error', async () => {
      const promise = service.scanBuffer(Buffer.from('data'), 'file.txt');
      await new Promise((r) => setTimeout(r, 0));
      netMock._handlers['connect']();
      netMock._handlers['error'](new Error('Connection refused'));
      const result = await promise;
      expect(result.clean).toBe(true);
      expect(result.error).toBe('Connection refused');
    });

    it('returns fail-open on socket timeout', async () => {
      const promise = service.scanBuffer(Buffer.from('data'), 'file.txt');
      await new Promise((r) => setTimeout(r, 0));
      netMock._handlers['connect']();
      netMock._handlers['timeout']();
      const result = await promise;
      expect(result.clean).toBe(true);
      expect(result.error).toBe('ClamAV socket timeout');
    });

    it('rejects when net.createConnection throws inside Promise executor', async () => {
      netMock.createConnection.mockImplementationOnce(() => {
        throw new Error('net error');
      });
      await expect(
        service.scanBuffer(Buffer.from('data'), 'file.txt'),
      ).rejects.toThrow('net error');
    });
  });
});
