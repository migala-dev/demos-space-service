const Joi = require('joi');

const spaceInfo = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    approvalPercentage: Joi.number().greater(50).less(101).required(),
    participationPercentage: Joi.number().greater(50).less(101).required(),
  }),
};

const sendInvitation = {
  body: Joi.object().keys({
    users: Joi.array()
      .items(
        Joi.object().keys({
          phoneNumber: Joi.string().allow(null, ''),
          userId: Joi.string().allow(null, ''),
        })
      )
      .min(1)
      .required(),
  }),
};

module.exports = {
  spaceInfo,
  sendInvitation,
};
