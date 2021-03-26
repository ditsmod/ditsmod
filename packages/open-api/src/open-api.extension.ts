import { Injectable } from '@ts-stack/di';
import { edk, Logger } from '@ditsmod/core';

@Injectable()
export class OpenApiExtension implements edk.Extension {
  constructor(private log: Logger) {}

  async init() {
    this.log.info('OpenApiExtension inited');
  }
}