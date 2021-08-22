const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const RoleUserSpaceRepository = require('../shared/repositories/role-user-space.repository');
const UserSpaceRepository = require('../shared/repositories/user-space.reporitory');
const { Space, RoleUserSpace, UserSpace } = require('../shared/models');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const removeS3File = require('../shared/utils/removeS3File');

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
  const space = await SpaceRepository.findOneById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found');
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

module.exports = {
  create,
  uploadPicture,
};
