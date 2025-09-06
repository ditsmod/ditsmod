import type { AnyTRPCRouter } from '@trpc/server';
import { createTRPCClient, httpBatchLink, loggerLink, TRPCClient } from '@trpc/client';
import { tap } from '@trpc/server/observable';
import { inspect } from 'node:util';

import type { PostRouter } from './modules/post/post.module.js';
import type { MessageRouter } from './modules/message/message.module.js';
import type { AuthRouter } from './modules/auth/auth.module.js';

const url = 'http://localhost:2021/trpc';
const trpc = createTRPCClient<AnyTRPCRouter>({
  links: [
    function callback() {
      return ({ op, next }) => {
        // console.log('->', op.type, op.path, op.input);

        return next(op).pipe(
          tap({
            next(result) {
              console.log(
                `${op.path}.${op.type}(${inspect(op.input, false, 2)}) ->`,
                `\x1b[34m ${inspect(result.result.data, false, 2)}\x1b[0m`,
              );
            },
          }),
        );
      };
    },
    httpBatchLink({ url }),
  ],
});

const messageClient = trpc as TRPCClient<MessageRouter>;

// parallel queries
await Promise.all([
  //
  messageClient.hello.query(),
  messageClient.hello.query('client'),
]);
await messageClient.message.addMessage.mutate('one more message!');
await messageClient.message.listMessages.query();

const trpcPost = trpc as TRPCClient<PostRouter>;
await trpcPost.post.createPost.mutate({ title: 'hello client' });
await trpcPost.post.listPosts.query();
await trpcPost.post.comments.listComments.query();
const authedClient = createTRPCClient<AnyTRPCRouter>({
  links: [
    // loggerLink(),
    httpBatchLink({
      url,
      headers: () => ({ authorization: 'secret' }),
    }),
  ],
});

const authClient = authedClient as TRPCClient<AuthRouter>;
await authClient.admin.secret.query();
console.log('👌 should be a clean exit if everything is working right');
