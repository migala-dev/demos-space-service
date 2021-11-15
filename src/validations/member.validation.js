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

const updateMember = {
  body: Joi.object().keys({
    role: Joi.string().valid(...Object.values(spaceRoleEnum)),
    name: Joi.string().allow(null, ''),
  }),
};

module.exports = {
  sendInvitation,
  updateMember,
};
