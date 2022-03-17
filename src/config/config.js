/*
  DEMOS
  Copyright (C) 2022 Julian Alejandro Ortega Zepeda, Erik Ivanov Domínguez Rivera, Luis Ángel Meza Acosta
  This file is part of DEMOS.

  DEMOS is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  DEMOS is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3001),
    AWS_REGION: Joi.string().required().description('AWS Cognito - Region'),
    AWS_ACCESS_KEY_ID: Joi.string().required().description('AWS - Access Key'),
    AWS_SECRET_ACCESS_KEY: Joi.string().required().description('AWS - Secret Access Key'),
    AWS_S3_BUCKET: Joi.string().required().description('AWS - S3 Bucket'),
    PGHOST: Joi.string().required().description('PostgresSQL - Host'),
    PGUSER: Joi.string().required().description('PostgresSQL - User'),
    PGDATABASE: Joi.string().required().description('PostgresSQL - Database'),
    PGPORT: Joi.string().required().description('PostgresSQL - Port'),
    WEB_SOCKET_URL: Joi.string().required().description('Web Socket - Url'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  webSocketUrl: envVars.WEB_SOCKET_URL,
  aws: {
    region: envVars.AWS_REGION,
    userPoolId: envVars.AWS_USER_POOL_ID,
    clientId: envVars.AWS_CLIENT_ID,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    bucket: envVars.AWS_S3_BUCKET,
  },
  pg: {
    host: envVars.PGHOST,
    user: envVars.PGUSER,
    database: envVars.PGDATABASE,
    port: envVars.PGPORT,
  },
};
