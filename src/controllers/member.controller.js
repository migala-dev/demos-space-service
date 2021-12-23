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
  getMember,
  deleteMember,
  cancelInvitation,
  leaveSpace,
};
