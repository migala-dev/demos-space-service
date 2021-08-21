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
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
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
