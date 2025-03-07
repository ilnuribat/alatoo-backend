import Router from 'koa-router';
import Joi from 'joi';
import { getKnex } from '../knex.js';

export * from './auth.js';


export const router = new Router();

router.get('/users', async (ctx) => {
  const knex = await getKnex();
  const users = await knex('users');

  ctx.body = { users };
  ctx.status = 200;
});


router.get('/parsing/:id', async (ctx) => {
  const knex = await getKnex();
  const parsing = await knex('parsing')
    .where({ id: ctx.params.id })
    .first();

  ctx.body = {
    parsing,
  };
  ctx.status = 200;
});

