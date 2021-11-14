const Joi = require('joi');

const spaceInfo = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    approvalPercentage: Joi.number().greater(50).less(101).required(),
    participationPercentage: Joi.number().greater(50).less(101).required(),
  }),
};

module.exports = {
  spaceInfo,
};
