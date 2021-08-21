const Joi = require('joi');

const creation = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    approvalPercentage: Joi.number().greater(50).less(101).required(),
    participationPercentage: Joi.number().greater(50).less(101).required(),
  }),
};

module.exports = {
  creation,
};
