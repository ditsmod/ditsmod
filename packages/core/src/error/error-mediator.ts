import { injectable } from '#di';
import { ModuleExtract } from '#types/module-extract.js';

@injectable()
export class ErrorMediator {
  constructor(protected moduleExtract: ModuleExtract) {}
}
