import dotenv from 'dotenv';

dotenv.config();

export const HTTP_PORT = 8080;

const {
  PG_URI,
} = process.env;


export {
  PG_URI,
};
