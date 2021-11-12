const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const catchAsync = require('../shared/utils/catchAsync');
const { spaceService } = require('../services');

const create = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const space = await spaceService.create(cognitoId, req.body);
  res.send(space);
});

const getAllUserSpaces = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const response = await spaceService.getAllUserSpaces(cognitoId);
  res.send(response);
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

const updateSpaceInfo = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;
  const space = await spaceService.updateSpaceInfo(cognitoId, spaceId, req.body);
  res.send(space);
});

const getSpaceInfo = catchAsync(async (req, res) => {
  const cognitoId = req.user.username;
  const { spaceId } = req.params;

  const result = await spaceService.getSpaceInfo(cognitoId, spaceId);

  res.send(result);
});


module.exports = {
  create,
  getAllUserSpaces,
  updateSpaceInfo,
  uploadPicture,
  getSpaceInfo,
};
