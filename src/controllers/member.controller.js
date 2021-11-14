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

module.exports = {
  sendInvitations,
  acceptInvitation,
  rejectInvitation,
};
