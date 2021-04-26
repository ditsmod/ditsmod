import { Schema } from '@ditsmod/openapi';

export class Post {
  @Schema({ type: 'number', minimum: 3, maximum: 100000 })
  postId: number;

  @Schema({type: 'string'})
  postTitle: string;

  @Schema({type: 'string'})
  postLead: string;
}
