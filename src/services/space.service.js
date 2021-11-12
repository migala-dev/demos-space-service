const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const MemberRepository = require('../shared/repositories/member.repository');
const { Space, User, Member } = require('../shared/models');
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

/**
 * Create space
 * @param {ObjectId} cognitoId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const create = async (cognitoId, newSpace) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);

  const space = await createSpace(newSpace, currentUser);

  const member = await MemberRepository.createMember(
    space.spaceId,
    currentUser.userId,
    invitationStatusEnum.ACCEPTED,
    spaceRoleEnum.ADMIN,
    currentUser.userId
  );

  return { space, member };
};

/**
 * Get all user's spaces
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
  const members = await MemberRepository.findAllBySpaceIds(spaceIds);
  const userIds = members.map((u) => u.userId);
  const users = await UserRepository.findAllByIds(userIds);

  return { spaces, members, users };
};

const notifyMembersForSpaceUpdate = async (spaceId) => {
  const members = await MemberRepository.findUsersBySpaceId(spaceId);
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

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userRoleSpace || member.role !== spaceRoleEnum.ADMIN) {
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

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userRoleSpace || member.role !== spaceRoleEnum.ADMIN) {
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

const markInvitationAs = async (memberId, invitationStatus) => {
  const member = new Member();
  member.invitationStatus = invitationStatus;
  return MemberRepository.save(memberId, member);
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

  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found');
  }

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not member of this space');
  }

  if (member.invitationStatus === invitationStatusEnum.SENDED) {
    await markInvitationAs(member.memberId, invitationStatusEnum.RECEIVED);
    member.invitationStatus = invitationStatusEnum.RECEIVED;
  }

  return { space, member };
};

module.exports = {
  create,
  getAllUserSpaces,
  uploadPicture,
  getSpaceInfo,
  updateSpaceInfo,
};
