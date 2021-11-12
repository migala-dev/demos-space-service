const Joi = require('joi');
const spaceRoleEnum = require('../shared/enums/space-role.enum');

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

const updateRole = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    role: Joi.string().valid(...Object.values(spaceRoleEnum)),
  }),
};

module.exports = {
  sendInvitation,
  updateRole,
};
