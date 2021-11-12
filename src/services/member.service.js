const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const RoleUserSpaceRepository = require('../shared/repositories/role-user-space.repository');
const UserSpaceRepository = require('../shared/repositories/user-space.reporitory');
const CacheRepository = require('../shared/repositories/cache.repository');
const { UserSpace, Cache } = require('../shared/models');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const logger = require('../shared/config/logger');
const cacheService = require('../shared/services/cache.service');

const createUser = (phoneNumber) => {
  const user = new User();
  user.phoneNumber = phoneNumber;

  return UserRepository.create(user);
};

const findUser = (phoneNumber) => {
  return UserRepository.findOneByPhoneNumber(phoneNumber);
};

const createInvitationCache = (userId, spaceId) => {
  const cache = new Cache();
  cache.entityName = 'userSpace';
  cache.eventName = 'invitation';
  cache.userId = userId;
  cache.data = JSON.stringify({ spaceId });
  return CacheRepository.create(cache);
};

const createInvitation = async (userParams, spaceId, createdBy) => {
  let { userId } = userParams;
  const { phoneNumber } = userParams;

  if (!userId && phoneNumber && phoneNumber.length >= 10) {
    const user = await findUser(phoneNumber);
    if (user) {
      userId = user.userId;
    } else {
      const userCreated = await createUser(phoneNumber);
      userId = userCreated.userId;
    }
  }

  if (!userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User Id not found');
  }

  const userSpace = await UserSpaceRepository.findByUserIdAndSpaceId(userId, spaceId);
  if (!userSpace) {
    const invitation = await createUserSpace(spaceId, userId, invitationStatusEnum.SENDED, createdBy);
    await createInvitationCache(userId, spaceId);
    cacheService.emitUpdateCache(userId);
    return invitation;
  }
  return userSpace;
};

const createUserInviations = async (users, spaceId, createdBy) => {
  const invitations = await Promise.all(
    users.map(async (user) => {
      try {
        const invitation = await createInvitation(user, spaceId, createdBy);
        return invitation;
      } catch (err) {
        logger.error(err);
        return null;
      }
    })
  );

  return invitations.filter((inv) => !!inv);
};

const markInvitationAs = async (userSpaceId, invitationStatus) => {
  const userSpace = new UserSpace();
  userSpace.invitationStatus = invitationStatus;
  return UserSpaceRepository.save(userSpaceId, userSpace);
};

/**
 * Send invitation
 * @param {String} cognitoId
 * @param {String} spaceId
 * @param {Array<{ userId, phone }>} users
 * @returns {Promise<String>}
 */
const sendInvitations = async (cognitoId, spaceId, users) => {
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

  const invitations = createUserInviations(users, spaceId, currentUser.userId);

  return invitations;
};

const createAcceptInvitationCache = (userId, userSpaceId) => {
  const cache = new Cache();
  cache.entityName = 'userSpace';
  cache.eventName = 'accept-invitation';
  cache.userId = userId;
  cache.data = JSON.stringify({ userSpaceId });
  return CacheRepository.create(cache);
};

const notifyNewMemeber = (memebrs, userSpaceId) => {
  return Promise.all(
    memebrs.map(async (member) => {
      try {
        await createAcceptInvitationCache(member.userId, userSpaceId);
        cacheService.emitUpdateCache(member.userId);
      } catch (err) {
        logger.error(err);
      }
      return null;
    })
  );
};

/**
 * Accept Invitation
 * @param {String} cognitoId
 * @param {String} spaceId
 * @returns {Promise<String>}
 */
const acceptSpaceInvitation = async (cognitoId, spaceId) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const userSpace = await UserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userSpace) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not part of this space.');
  }
  if (userSpace.invitationStatus === invitationStatusEnum.CANCELED) {
    return userSpace;
  }

  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found.');
  }

  let members = await UserSpaceRepository.findMembers(spaceId);
  members = members.filter((m) => m.userId !== currentUser.userId);

  const users = await Promise.all(
    members.map(async (member) => {
      try {
        const user = await UserRepository.findById(member.userId);
        return user;
      } catch (err) {
        logger.error(err);
        return null;
      }
    })
  );

  if (userSpace.invitationStatus === invitationStatusEnum.RECEIVED) {
    await markInvitationAs(userSpace.userSpaceId, invitationStatusEnum.ACCEPTED);
    userSpace.invitationStatus = invitationStatusEnum.ACCEPTED;
    notifyNewMemeber(members, userSpace.userSpaceId);
  }

  const userRoles = await RoleUserSpaceRepository.findBySpaceId(spaceId);

  return { space, userSpace, members, users, userRoles };
};

/**
 * Reject Invitation
 * @param {String} cognitoId
 * @param {String} spaceId
 * @returns {Promise<String>}
 */
const rejectSpaceInvitation = async (cognitoId, spaceId) => {
  const currentUser = await UserRepository.findOneByCognitoId(cognitoId);
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const userSpace = await UserSpaceRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!userSpace) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not part of this space.');
  }

  if (userSpace.invitationStatus === invitationStatusEnum.RECEIVED) {
    await markInvitationAs(userSpace.userSpaceId, invitationStatusEnum.REJECTED);
    userSpace.invitationStatus = invitationStatusEnum.REJECTED;
  }

  return { userSpace };
};

module.exports = {
  sendInvitations,
  acceptSpaceInvitation,
  rejectSpaceInvitation,
};
