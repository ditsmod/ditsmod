import { Column } from '@ditsmod/openapi';

export class Post {
  @Column({ minimum: 1, maximum: 100000 })
  postId: number;

  @Column({ minLength: 20, maxLength: 300 })
  postTitle: string;

  @Column({ minLength: 1, maxLength: 10 })
  postLead: string;
}
