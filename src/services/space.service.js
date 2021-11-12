const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const RoleUserSpaceRepository = require('../shared/repositories/role-user-space.repository');
const UserSpaceRepository = require('../shared/repositories/user-space.reporitory');
const { Space, RoleUserSpace, UserSpace, User, Cache } = require('../shared/models');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const removeS3File = require('../shared/utils/removeS3File');
const notificationService = require('./notification.service');

const createSpace = (newSpace, currentUser) => {
  const space = new Space();
  space.name = newSpace.name;
  space.description = newSpace.description;
  space.approvalPercentage = newSpace.approvalPercentage;
  space.participationPercentage = newSpace.participationPercentage;
  space.ownerId = currentUser.userId;
  return SpaceRepository.create(space);
};

const createRoleUserSpace = (spaceId, userId, role, createdBy) => {
  const roleUserSpace = new RoleUserSpace();
  roleUserSpace.spaceId = spaceId;
  roleUserSpace.userId = userId;
  roleUserSpace.role = role;
  roleUserSpace.createdBy = createdBy;
  roleUserSpace.updatedBy = createdBy;
  return RoleUserSpaceRepository.create(roleUserSpace);
};

const createUserSpace = (spaceId, userId, invitationStatus, createdBy) => {
  const userSpace = new UserSpace();
  userSpace.spaceId = spaceId;
  userSpace.userId = userId;
  userSpace.invitationStatus = invitationStatus;
  userSpace.createdBy = createdBy;
  userSpace.updatedBy = createdBy;
  return UserSpaceRepository.create(userSpace);
};

/**
 * Create space
 * @param {ObjectId} cognitoId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const create = async (cognitoId, newSpace) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);

  const space = await createSpace(newSpace, currentUser);
  const roleUserSpace = await createRoleUserSpace(
    space.spaceId,
    currentUser.userId,
    spaceRoleEnum.ADMIN,
    currentUser.userId
  );
  const userSpace = await createUserSpace(
    space.spaceId,
    currentUser.userId,
    invitationStatusEnum.ACCEPTED,
    currentUser.userId
  );

  return { space, roleUserSpace, userSpace };
};

/**
 * Get all user spaces
 * @param {ObjectId} cognitoId
 * @returns {Promise<User>}
 */
const getAllUserSpaces = async (cognitoId) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const spaces = await SpaceRepository.findAllByUserId(currentUser.userId);
  const spaceIds = spaces.map((s) => s.spaceId);
  const userSpaces = await UserSpaceRepository.findAllBySpaceIds(spaceIds);
  const userIds = userSpaces.map((u) => u.userId);
  const users = await UserRepository.findAllByIds(userIds);
  const roleUserSpaces = await RoleUserSpaceRepository.findAllBySpaceIds(spaceIds);

  return { spaces, userSpaces, roleUserSpaces, users };
};

const notifyMembersForSpaceUpdate = async (spaceId) => {
  const members = await UserSpaceRepository.findUsersBySpaceId(spaceId);
  notificationService.notifySpaceUpdatedEvent(members, spaceId);
};

/**
 * Update space info
 * @param {String} cognitoId
 * @param {Space} space
 * @returns {Promise<String>}
 */
const updateSpaceInfo = async (cognitoId, spaceId, spaceInfo) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found');
  }

  const userRoleSpace = await RoleUserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userRoleSpace || userRoleSpace.role !== spaceRoleEnum.ADMIN) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not admin from this space');
  }
  const { name, description, approvalPercentage, participationPercentage } = spaceInfo;

  await SpaceRepository.updateNameAndDescriptionAndPercentages(
    spaceId,
    name,
    description,
    approvalPercentage,
    participationPercentage
  );
  const spaceUpdated = await SpaceRepository.findById(spaceId);

  notifyMembersForSpaceUpdate(spaceId);

  return spaceUpdated;
};

/**
 * Upload an avatar image
 * @param {String} cognitoId
 * @param {File} file
 * @returns {Promise<String>}
 */
const uploadPicture = async (cognitoId, spaceId, file) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found');
  }

  const userRoleSpace = await RoleUserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userRoleSpace || userRoleSpace.role !== spaceRoleEnum.ADMIN) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not admin from this space');
  }

  const oldImageKey = space.pictureKey;
  const pictureKey = file.key;
  Object.assign(space, { pictureKey });
  const spaceToUpdate = new Space();
  spaceToUpdate.pictureKey = pictureKey;
  await SpaceRepository.save(spaceId, spaceToUpdate);
  removeS3File(oldImageKey);
  return space;
};

const markInvitationAs = async (userSpaceId, invitationStatus) => {
  const userSpace = new UserSpace();
  userSpace.invitationStatus = invitationStatus;
  return UserSpaceRepository.save(userSpaceId, userSpace);
};

/**
 * Get space info
 * @param {String} cognitoId
 * @param {String} spaceId
 * @returns {Promise<String>}
 */
const getSpaceInfo = async (cognitoId, spaceId) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const userSpace = await UserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userSpace) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not part of this space');
  }

  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found');
  }

  if (userSpace.invitationStatus === invitationStatusEnum.SENDED) {
    await markInvitationAs(userSpace.userSpaceId, invitationStatusEnum.RECEIVED);
    userSpace.invitationStatus = invitationStatusEnum.RECEIVED;
  }

  const roleUserSpace = await RoleUserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);

  return { space, roleUserSpace, userSpace };
};

module.exports = {
  create,
  getAllUserSpaces,
  uploadPicture,
  getSpaceInfo,
  updateSpaceInfo,
};
