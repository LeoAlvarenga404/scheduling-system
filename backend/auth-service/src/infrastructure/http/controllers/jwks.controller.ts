import { Controller, Get } from '@nestjs/common';
import { RsaKeyService } from '../services/rsa-key.service';

@Controller('.well-known')
export class JwksController {
  constructor(private readonly rsaKeyService: RsaKeyService) {}

  @Get('jwks.json')
  getJwks() {
    return this.rsaKeyService.getJwks();
  }
}
