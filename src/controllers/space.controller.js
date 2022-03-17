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
  const { space } = req;

  const spaceUpdated = await spaceService.uploadPicture(space, req.file);

  res.send(spaceUpdated);
});

const updateSpaceInfo = catchAsync(async (req, res) => {
  const { space, user } = req;

  const spaceUpdated = await spaceService.updateSpaceInfo(space, req.body, user);

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
