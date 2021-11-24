const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const MemberRepository = require('../shared/repositories/member.repository');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const removeS3File = require('../shared/utils/removeS3File');
const memberNotification = require('../shared/notifications/members.notification');
const spaceNotification = require('../shared/notifications/space.notification');

/**
 * Create space
 * @param {User} currentUser
 * @param {Object} newSpace
 * @returns {Promise<User>}
 */
const create = async (currentUser, newSpace) => {
  const space = await SpaceRepository.createSpace(newSpace, currentUser);

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
 * @param {User} currentUser
 * @returns {Promise<User>}
 */
const getAllUserSpaces = async (currentUser) => {
  const spaces = await SpaceRepository.findAllByUserId(currentUser.userId);
  const spaceIds = spaces.map((s) => s.spaceId);
  const members = await MemberRepository.findAllBySpaceIds(spaceIds);
  const userIds = members.map((u) => u.userId);
  const users = await UserRepository.findAllByIds(userIds);

  return { spaces, members, users };
};

/**
 * Update space info
 * @param {Space} space
 * @returns {Promise<String>}
 */
const updateSpaceInfo = async (space, spaceInfo) => {
  const { name, description, approvalPercentage, participationPercentage } = spaceInfo;

  await SpaceRepository.updateNameAndDescriptionAndPercentages(
    space.spaceId,
    name,
    description,
    approvalPercentage,
    participationPercentage
  );
  const spaceUpdated = await SpaceRepository.findById(space.spaceId);

  spaceNotification.spaceUpdated(space.spaceId);

  return spaceUpdated;
};

/**
 * Upload an avatar image
 * @param {Space} space
 * @param {File} file
 * @returns {Promise<Space>}
 */
const uploadPicture = async (space, file) => {
  const oldImageKey = space.pictureKey;
  const pictureKey = file.key;
  Object.assign(space, { pictureKey });

  await SpaceRepository.updatePictureKey(space.spaceId, pictureKey);

  if(oldImageKey) {
    removeS3File(oldImageKey);
  }

  spaceNotification.spaceUpdated(space.spaceId);

  return space;
};

/**
 * Get space info
 * @param {Space} space
 * @param {Member} member
 * @returns {Promise<String>}
 */
const getSpaceInfo = async (space, member) => {
  if (member.invitationStatus === invitationStatusEnum.SENDED) {
    await MemberRepository.updateInvitationStatus(member.memberId, invitationStatusEnum.RECEIVED, member.userId);
    Object.assign(member, { invitationStatus: invitationStatusEnum.RECEIVED });
    memberNotification.memberUpdated(space.spaceId, member.memberId);
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
