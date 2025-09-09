import type { AnyTRPCRouter } from '@trpc/server';
import { createTRPCClient, httpBatchLink, loggerLink, TRPCClient } from '@trpc/client';
import { tap } from '@trpc/server/observable';
import { inspect } from 'node:util';

import type { PostRouter } from '#post/post.module.js';
import type { MessageRouter } from '#message/message.module.js';
import type { AuthRouter } from '#auth/auth.module.js';

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
const hello = await Promise.all([
  //
  messageClient.hello.query(),
  messageClient.hello.query('client'),
]);
const message = await messageClient.message.addMessage.mutate('one more message!');
const messagesList = await messageClient.message.listMessages.query();

const postClient = trpc as TRPCClient<PostRouter>;
const post = await postClient.post.createPost.mutate({ title: 'hello client' });
const postList = await postClient.post.listPosts.query();
const commentsList = await postClient.post.comments.listComments.query();
const authedClient = createTRPCClient<AnyTRPCRouter>({
  links: [
    // loggerLink(),
    httpBatchLink({
      url,
      headers: () => ({ authorization: 'Bearer secret' }),
    }),
  ],
});

const authClient = authedClient as TRPCClient<AuthRouter>;
const authInfo = await authClient.admin.secret.query();
console.log('👌 should be a clean exit if everything is working right');
