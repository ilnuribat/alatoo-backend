import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import { getKnex } from './knex.js';
import { HTTP_PORT } from './utils/config.js';
import {
  router,
  authRouter,
} from './controllers/index.js';


// const delay = (ms) => new Promise((res) => setTimeout(res, ms));


async function main() {
  console.log('start', new Date());

  const knex = await getKnex();
  const res = await knex.raw('select 1 + 1 as sum');

  const app = new Koa();

  app.use(bodyparser());
  app.use((async (ctx, next) => {
    try {
      await next();
      console.log('after request in try-catch');
    } catch (e) {
      if (e.isJoi) {
        console.log('this is joi error');
        ctx.status = 400;
        ctx.body = {
          errors: e.details,
        };

        return;
      }

      console.log('caught in try-catch', e.message);

      ctx.status = 500;
      ctx.body = {
        message: e.message,
      };
    }
  }));
  app.use(async (ctx, next) => {
    console.log(ctx.method, ctx.url, ctx.body);

    await next();
    console.log('after request in logger');
  });
  app.use(authRouter.routes());

  app.use(async (ctx, next) => {
    const { headers } = ctx.request;
    const { authorization } = headers;
    const token = authorization?.split(' ')[1];

    if (token) {
      const { rows: [userInfo] } = await knex.raw(`
        select * from tokens
        inner join users
          on users.id = tokens.user_id
        where tokens.token = ?
      `, [token]);

      if (!userInfo) {
        throw new Error('NOT AUTHORIZED');
      }

      ctx.state.user = userInfo;

      return next();
    }

    throw new Error('NOT AUTHORIZED');
  });
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (ctx) => {
    ctx.body = {
      hello: 'world',
    };

    ctx.status = 200;
  });

  console.log(res.rows);

  app.listen(HTTP_PORT, () => {
    console.log(`server started at port ${HTTP_PORT}`);
  });
}

main().catch((e) => {
  console.log(e);

  process.exit(1);
});

