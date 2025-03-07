import * as crypto from 'node:crypto';
import Router from 'koa-router';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { getKnex } from '../knex.js';

const authRouter = new Router();

authRouter.post('/register', async (ctx) => {
  const joiSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { email, password } = await joiSchema.validateAsync(ctx.request.body);

  const passwordHash = await bcrypt.hash(password, 12);

  const knex = await getKnex();

  const dbUser = await knex('users').insert({
    email,
    password: passwordHash,
  }).returning('*');

  ctx.body = { dbUser };
  ctx.status = 201; // created
});

authRouter.post('/login', async (ctx) => {
  const joiSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { email, password } = await joiSchema.validateAsync(ctx.request.body);

  const knex = await getKnex();
  const dbUser = await knex('users').where({ email }).first();

  if (!dbUser) {
    throw new Error('USER_NOT_FOUND');
  }

  const match = await bcrypt.compare(password, dbUser.password);

  if (!match) {
    throw new Error('login or password is uncorrect');
  }

  const token = crypto.randomBytes(20).toString('hex');

  await knex('tokens').insert({
    user_id: dbUser.id,
    token,
  });

  ctx.status = 200;
  ctx.body = { ok: true, token };
  ctx.cookies.set('token', token, { httpOnly: true });
});

authRouter.post('/logout', async (ctx) => {
  ctx.cookies.set('token', '', { httpOnly: true });
  const { headers } = ctx.request;
  const { authorization } = headers;
  const token = authorization?.split(' ')[1];

  const knex = await getKnex();
  if (token) {
    await knex('tokens').where({ token }).del();
  }


  const cookieToken = ctx.cookies.get('token');

  if (cookieToken) {
    await knex('tokens').where({ token: cookieToken }).del();
  }

  ctx.status = 200;
});

export { authRouter };
