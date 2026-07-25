import { restModule } from '@ditsmod/rest';
import { TypeormModule } from '@ditsmod/typeorm';

import { User } from './user.entity.js';
import { UserController } from './user.controller.js';

@restModule({
  imports: [TypeormModule.forFeature([User])],
  controllers: [UserController],
})
export class UserModule {}
