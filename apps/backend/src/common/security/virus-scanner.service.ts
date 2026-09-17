import { Injectable, Logger, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClamScanResult {
  clean: boolean;
  virus?: string;
  error?: string;
}

@Global()
@Injectable()
export class VirusScannerService {
  private readonly logger = new Logger(VirusScannerService.name);
  private clamavHost: string;
  private clamavPort: number;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.clamavHost = this.configService.get<string>('CLAMAV_HOST', '');
    this.clamavPort = this.configService.get<number>('CLAMAV_PORT', 3310);
    this.enabled = !!this.clamavHost;

    if (this.enabled) {
      this.logger.log(`Virus scanning enabled (ClamAV at ${this.clamavHost}:${this.clamavPort})`);
    } else {
      this.logger.warn(
        'Virus scanning disabled — set CLAMAV_HOST to enable',
      );
    }
  }

  async scanBuffer(buffer: Buffer, filename: string): Promise<ClamScanResult> {
    if (!this.enabled) {
      return { clean: true };
    }

    try {
      const net = await import('net');
      return new Promise((resolve) => {
        const socket = net.createConnection(this.clamavPort, this.clamavHost);
        let response = '';
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socket.destroy();
            resolve({ clean: true, error: 'ClamAV timeout — scanning skipped' });
          }
        }, 30_000);

        socket.on('connect', () => {
          socket.write(`zINSTREAM\0`);

          // Send file size + data + zero terminator
          const sizeBuf = Buffer.alloc(4);
          sizeBuf.writeUInt32BE(buffer.length, 0);
          socket.write(sizeBuf);
          socket.write(buffer);
          socket.write(Buffer.alloc(4));
        });

        socket.on('data', (data) => {
          response += data.toString();

          if (response.includes('OK')) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              socket.end();
              resolve({ clean: true });
            }
          } else if (response.includes('FOUND')) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              socket.end();
              const virusMatch = response.match(/stream: (.+?) FOUND/);
              resolve({
                clean: false,
                virus: virusMatch?.[1] || 'unknown',
              });
            }
          }
        });

        socket.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.logger.warn(`ClamAV connection error: ${err.message}`);
            resolve({ clean: true, error: err.message });
          }
        });

        socket.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            socket.destroy();
            resolve({ clean: true, error: 'ClamAV socket timeout' });
          }
        });
      });
    } catch (err) {
      this.logger.warn(`Scan failed: ${err}`);
      return { clean: true, error: 'Scan unavailable' };
    }
  }

  isAvailable(): boolean {
    return this.enabled;
  }
}
