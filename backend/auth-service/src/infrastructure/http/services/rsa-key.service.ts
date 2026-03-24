import { Injectable, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RsaKeyService implements OnModuleInit {
  private privateKey: string;
  private publicKey: string;

  async onModuleInit() {
    // In a real environment, keys should be loaded from secure secrets or persistent files.
    // For local dev, we'll check if they exist or generate them.
    const keysPath = path.resolve(process.cwd(), 'keys');
    if (!fs.existsSync(keysPath)) {
      fs.mkdirSync(keysPath);
    }

    const privateKeyPath = path.join(keysPath, 'private.pem');
    const publicKeyPath = path.join(keysPath, 'public.pem');

    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
      this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      this.publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    } else {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      this.privateKey = privateKey;
      this.publicKey = publicKey;

      fs.writeFileSync(privateKeyPath, privateKey);
      fs.writeFileSync(publicKeyPath, publicKey);
    }
  }

  getPrivateKey(): string {
    return this.privateKey;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getJwks() {
    const key = crypto.createPublicKey(this.publicKey);
    const jwk = key.export({ format: 'jwk' });

    return {
      keys: [
        {
          ...jwk,
          kid: 'auth-service-key-1',
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }
}
