const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const catchAsync = require('../shared/utils/catchAsync');
const { spaceService } = require('../services');

const create = catchAsync(async (req, res) => {
  const { user } = req;
  const space = await spaceService.create(user, req.body);
  res.send(space);
});

const getAllUserSpaces = catchAsync(async (req, res) => {
  const { user } = req;
  const response = await spaceService.getAllUserSpaces(user);
  res.send(response);
});

const uploadPicture = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Space image required');
  }
  const { user, space } = req;

  const spaceUpdated = await spaceService.uploadPicture(user, space, req.file);

  res.send(spaceUpdated);
});

const updateSpaceInfo = catchAsync(async (req, res) => {
  const { space } = req;

  const spaceUpdated = await spaceService.updateSpaceInfo(space, req.body);

  res.send(spaceUpdated);
});

const getSpaceInfo = catchAsync(async (req, res) => {
  const { space, member } = req;

  const result = await spaceService.getSpaceInfo(space, member);

  res.send(result);
});

module.exports = {
  create,
  getAllUserSpaces,
  updateSpaceInfo,
  uploadPicture,
  getSpaceInfo,
};
