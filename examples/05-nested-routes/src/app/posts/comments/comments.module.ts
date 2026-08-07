import { restModule } from '@holu/rest';
import { CommentsController } from './comments.controller.js';

@restModule({ controllers: [CommentsController] })
export class CommentsModule {}
