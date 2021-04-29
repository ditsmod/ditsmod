import { Column } from '@ditsmod/openapi';

export class Post {
  @Column({ type: 'number', minimum: 3, maximum: 100000 })
  postId: number;

  @Column({type: 'string'})
  postTitle: string;

  @Column({type: 'string'})
  postLead: string;
}
