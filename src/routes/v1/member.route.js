const express = require('express');
const auth = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const validation = require('../../validations/member.validation');
const memberController = require('../../controllers/member.controller');
const { spaceRoleEnum } = require('../../shared/enums');
const spaceRole = require('../../shared/middlewares/space-role.middleware');
const spaceMember = require('../../shared/middlewares/space-member.middleware');

const router = express.Router();

router
  .route('/:spaceId/invitation')
  .post(auth(), validate(validation.sendInvitation), spaceRole(spaceRoleEnum.ADMIN), memberController.sendInvitations);
router.route('/:spaceId/invitation/accept').post(auth(), spaceMember, memberController.acceptInvitation);
router.route('/:spaceId/invitation/reject').post(auth(), spaceMember, memberController.rejectInvitation);
router.route('/:spaceId/:memberId').get(auth(), spaceMember, memberController.getMember);
router
  .route('/:spaceId/:memberId')
  .post(auth(), validate(validation.updateMember), spaceRole(spaceRoleEnum.ADMIN), memberController.updateMember);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Membres management
 */
