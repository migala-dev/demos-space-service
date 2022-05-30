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

const catchAsync = require('../shared/utils/catchAsync');
const { memberService } = require('../services');

const sendInvitations = catchAsync(async (req, res) => {
  const { user, space } = req;
  const { users } = req.body;

  const result = await memberService.sendInvitations(user, space, users);

  res.send(result);
});

const acceptInvitation = catchAsync(async (req, res) => {
  const { member, space } = req;

  const result = await memberService.acceptSpaceInvitation(member, space);

  res.send(result);
});

const rejectInvitation = catchAsync(async (req, res) => {
  const { member, space } = req;

  const result = await memberService.rejectSpaceInvitation(member, space);

  res.send(result);
});

const updateMember = catchAsync(async (req, res) => {
  const { user, space } = req;
  const { memberId } = req.params;
  const result = await memberService.updateMember(user, space, memberId, req.body);
  
  res.send(result);
});

const getMembersPhoneNumber = catchAsync(async (req, res) => {
  const { space } = req;
  const result = await memberService.getMembersPhoneNumber(space);
  
  res.send(result);
});

const getMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  const result = await memberService.getMember(memberId);

  res.send(result);
});

const deleteMember = catchAsync(async (req, res) => {
  const { user, space } = req;
  const { memberId } = req.params;
  const result = await memberService.deleteMember(memberId, user, space);

  res.send(result);
});

const cancelInvitation = catchAsync(async (req, res) => {
  const { user, space } = req;
  const { memberId } = req.params;
  const result = await memberService.cancelInvitation(memberId, user, space);

  res.send(result);
});

const leaveSpace = catchAsync(async (req, res) => {
  const { space, member } = req;

  const result = await memberService.leaveSpace(space, member);

  res.send(result);
});

module.exports = {
  sendInvitations,
  acceptInvitation,
  rejectInvitation,
  updateMember,
  getMembersPhoneNumber,
  getMember,
  deleteMember,
  cancelInvitation,
  leaveSpace,
};
