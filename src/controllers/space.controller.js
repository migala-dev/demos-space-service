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
  const space = await spaceService.uploadSpaceImage(req.query, req.file);
  res.send(space);
});

module.exports = {
  create,
  uploadPicture,
};
