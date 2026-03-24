import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RsaKeyService } from '../http/services/rsa-key.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService, RsaKeyService],
      useFactory: (config: ConfigService, rsa: RsaKeyService) => ({
        privateKey: rsa.getPrivateKey(),
        publicKey: rsa.getPublicKey(),
        signOptions: { algorithm: 'RS256' },
      }),
    }),
  ],
  providers: [RsaKeyService],
  exports: [RsaKeyService, JwtModule],
})
export class SecurityModule {}
