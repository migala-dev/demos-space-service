const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const catchAsync = require('../shared/utils/catchAsync');
const { spaceService } = require('../services');

const create = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const space = await spaceService.create(cognitoId, req.body);
  res.send(space);
});

const uploadPicture = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Space image required');
  }
  const cognitoId = req.user.username;
  const { spaceId } = req.params;
  const space = await spaceService.uploadPicture(cognitoId, spaceId, req.file);
  res.send(space);
});

const sendInvitations = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;
  const { users } = req.body;

  const result = await spaceService.sendInvitations(cognitoId, spaceId, users);

  res.send(result);
});

module.exports = {
  create,
  uploadPicture,
  sendInvitations,
};