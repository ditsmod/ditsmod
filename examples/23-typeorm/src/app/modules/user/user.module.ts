import { restModule } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';
import { TypeormModule } from '@ditsmod/typeorm';

import { User } from './user.entity.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@restModule({
  imports: [BodyParserModule, TypeormModule.forFeature([User])],
  controllers: [UserController],
  providersPerReq: [UserService],
})
export class UserModule {}
