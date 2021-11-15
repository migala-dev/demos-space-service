const catchAsync = require('../shared/utils/catchAsync');
const { memberService } = require('../services');

const sendInvitations = catchAsync(async (req, res) => {
  const { user, space } = req;
  const { users } = req.body;

  const result = await memberService.sendInvitations(user, space, users);

  res.send(result);
});

const acceptInvitation = catchAsync(async (req, res) => {
  const { user, space } = req;

  const result = await memberService.acceptSpaceInvitation(user, space);

  res.send(result);
});

const rejectInvitation = catchAsync(async (req, res) => {
  const { user, space } = req;

  const result = await memberService.rejectSpaceInvitation(user, space);

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

module.exports = {
  sendInvitations,
  acceptInvitation,
  rejectInvitation,
  updateMember,
  getMember,
};
