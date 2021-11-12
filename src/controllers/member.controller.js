const catchAsync = require('../shared/utils/catchAsync');
const { memberService } = require('../services');

const sendInvitations = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;
  const { users } = req.body;

  const result = await memberService.sendInvitations(cognitoId, spaceId, users);

  res.send(result);
});

const acceptInvitation = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;

  const result = await memberService.acceptSpaceInvitation(cognitoId, spaceId);

  res.send(result);
});

const rejectInvitation = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;

  const result = await memberService.rejectSpaceInvitation(cognitoId, spaceId);

  res.send(result);
});

module.exports = {
  sendInvitations,
  acceptInvitation,
  rejectInvitation,
};
