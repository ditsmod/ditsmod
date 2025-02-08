
import { table } from '#decorators/table.js';
import { getTableMetadata } from './utils.js';

describe('getTableMetadata()', () => {
  @table({ tableName: 'users' })
  class Users {
    userId: number;
    firstName: string;
    lastName: string;
  }

  class Posts {
    postId: number;
    authodId: number;
    postBody: string;
  }

  const [u, users_as_u, uAlias] = getTableMetadata(Users, 'u');
  const [p, posts_as_p, pAlias] = getTableMetadata(Posts, 'p');
  
  it('works with models with decorators', () => {
    expect(`${u}`).toBe('users as u');
    expect(users_as_u).toBe('users as u');
    expect(uAlias).toBe('u');
  });
  
  it('works with models without decorators', () => {
    expect(`${p}`).toBe('Posts as p');
    expect(posts_as_p).toBe('Posts as p');
    expect(pAlias).toBe('p');
  });
});