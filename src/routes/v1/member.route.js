const express = require('express');
const auth = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const validation = require('../../validations/member.validation');
const memberController = require('../../controllers/member.controller');

const router = express.Router();

router.route('/:spaceId/invitation').post(auth(), validate(validation.sendInvitation), memberController.sendInvitations);
router.route('/:spaceId/invitation/accept').post(auth(), memberController.acceptInvitation);
router.route('/:spaceId/invitation/reject').post(auth(), memberController.rejectInvitation);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Membres management
 */
