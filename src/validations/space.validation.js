const Joi = require('joi');

const creation = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

module.exports = {
  creation,
};
