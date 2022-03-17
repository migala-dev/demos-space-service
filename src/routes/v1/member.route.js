/*
  DEMOS
  Copyright (C) 2022 Julian Alejandro Ortega Zepeda, Erik Ivanov Domínguez Rivera, Luis Ángel Meza Acosta
  This file is part of DEMOS.

  DEMOS is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  DEMOS is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const express = require('express');
const auth = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const validation = require('../../validations/member.validation');
const memberController = require('../../controllers/member.controller');
const { spaceRoleEnum } = require('../../shared/enums');
const spaceRole = require('../../shared/middlewares/space-role.middleware');
const spaceMember = require('../../shared/middlewares/space-member.middleware');

const router = express.Router();

router.delete('/:spaceId', auth(), spaceMember, memberController.leaveSpace);
router
  .route('/:spaceId/invitation')
  .post(auth(), validate(validation.sendInvitation), spaceRole(spaceRoleEnum.ADMIN), memberController.sendInvitations);
router.route('/:spaceId/invitation/accept').post(auth(), spaceMember, memberController.acceptInvitation);
router.route('/:spaceId/invitation/reject').post(auth(), spaceMember, memberController.rejectInvitation);
router.route('/:spaceId/invitation/:memberId').delete(auth(), spaceRole(spaceRoleEnum.ADMIN), memberController.cancelInvitation);
router.route('/:spaceId/:memberId').get(auth(), spaceMember, memberController.getMember);
router
  .route('/:spaceId/:memberId')
  .post(auth(), validate(validation.updateMember), spaceRole(spaceRoleEnum.ADMIN), memberController.updateMember);
router.route('/:spaceId/:memberId').delete(auth(), spaceRole(spaceRoleEnum.ADMIN), memberController.deleteMember);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Membres management
 */
