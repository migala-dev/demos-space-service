const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const SpaceRepository = require('../shared/repositories/space.repository');
const MemberRepository = require('../shared/repositories/member.repository');
const CacheRepository = require('../shared/repositories/cache.repository');
const { Member, Cache } = require('../shared/models');
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
  cache.entityName = 'member';
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

  const member = await MemberRepository.findByUserIdAndSpaceId(userId, spaceId);
  if (!member) {
    const role = spaceRoleEnum.WORKER;
    const memberInvitation = await MemberRepository.createMember(spaceId, userId, invitationStatusEnum.SENDED, role, createdBy);
    await createInvitationCache(userId, spaceId);
    cacheService.emitUpdateCache(userId);
    return memberInvitation;
  }
  return member;
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

const markInvitationAs = async (memberId, invitationStatus) => {
  const member = new Member();
  member.invitationStatus = invitationStatus;
  return MemberRepository.save(memberId, member);
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

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!member || member.role !== spaceRoleEnum.ADMIN) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not admin from this space');
  }

  const invitations = createUserInviations(users, spaceId, currentUser.userId);

  return invitations;
};

const createAcceptInvitationCache = (userId, memberId) => {
  const cache = new Cache();
  cache.entityName = 'member';
  cache.eventName = 'accept-invitation';
  cache.userId = userId;
  cache.data = JSON.stringify({ memberId });
  return CacheRepository.create(cache);
};

const notifyNewMemeber = (memebrs, memberId) => {
  return Promise.all(
    memebrs.map(async (member) => {
      try {
        await createAcceptInvitationCache(member.userId, memberId);
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

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not part of this space.');
  }
  if (member.invitationStatus === invitationStatusEnum.CANCELED) {
    return member;
  }

  const space = await SpaceRepository.findById(spaceId);
  if (!space) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Space not found.');
  }

  let members = await MemberRepository.findBySpaceIdAndInvitationStatusAccepted(spaceId);
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

  if (member.invitationStatus === invitationStatusEnum.RECEIVED) {
    await markInvitationAs(member.memberId, invitationStatusEnum.ACCEPTED);
    member.invitationStatus = invitationStatusEnum.ACCEPTED;
    notifyNewMemeber(members, member.memberId);
  }


  return { space, members: [...members, member], users };
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

  const member = await MemberRepository.findByUserIdAndSpaceId(currentUser.userId, spaceId);
  if (!member) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User is not member of this space.');
  }

  if (member.invitationStatus === invitationStatusEnum.RECEIVED) {
    await markInvitationAs(member.memberId, invitationStatusEnum.REJECTED);
    member.invitationStatus = invitationStatusEnum.REJECTED;
  }

  return { member };
};

module.exports = {
  sendInvitations,
  acceptSpaceInvitation,
  rejectSpaceInvitation,
};
