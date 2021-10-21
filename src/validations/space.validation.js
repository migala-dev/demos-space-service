const Joi = require('joi');

const creation = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    approvalPercentage: Joi.number().greater(50).less(101).required(),
    participationPercentage: Joi.number().greater(50).less(101).required(),
  }),
};

const sendInvitation = {
  body: Joi.object().keys({
    users: Joi.array()
      .items(
        Joi.object().keys({
          phoneNumber: Joi.string(),
          userId: Joi.string(),
        })
      )
      .min(1)
      .required(),
  }),
};


module.exports = {
  creation,
  sendInvitation,
};
