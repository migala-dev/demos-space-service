const Joi = require('joi');

const spaceInfo = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    approvalPercentage: Joi.number().greater(50).less(101).required(),
    participationPercentage: Joi.number().greater(50).less(101).required(),
  }),
};

const updateSpaceInfo = {
  body: Joi.object().keys({
    name: Joi.string().allow(null),
    description: Joi.string().allow(null, ''),
    approvalPercentage: Joi.number().greater(50).less(101).allow(null),
    participationPercentage: Joi.number().greater(50).less(101).allow(null),
  }),
};


module.exports = {
  spaceInfo,
  updateSpaceInfo,
};
