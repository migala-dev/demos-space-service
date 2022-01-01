const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');
const UserRepository = require('../shared/repositories/user.repository');
const MemberRepository = require('../shared/repositories/member.repository');
const { User } = require('../shared/models');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const logger = require('../shared/config/logger');
const memberNotification = require('../shared/notifications/members.notification');

const createUser = (phoneNumber) => {
  const user = new User();
  user.phoneNumber = phoneNumber;

  return UserRepository.create(user);
};

const createInvitation = async (userParams, spaceId, createdBy) => {
  let { userId } = userParams;
  const { phoneNumber } = userParams;

  if (!userId && phoneNumber && phoneNumber.length >= 10) {
    const user = await UserRepository.findOneByPhoneNumber(phoneNumber);
    if (user) {
      userId = user.userId;
    } else {
      const userCreated = await createUser(phoneNumber);
      userId = userCreated.userId;
    }
  }

  const member = await MemberRepository.findByUserIdAndSpaceId(userId, spaceId);
  if (!member) {
    const role = spaceRoleEnum.WORKER;
    const memberInvitation = await MemberRepository.createMember(
      spaceId,
      userId,
      invitationStatusEnum.SENDED,
      role,
      createdBy
    );

    memberNotification.newInvitation(spaceId, userId);
    memberNotification.memberUpdated(spaceId, memberInvitation.memberId);

    return memberInvitation;
  }
  return member;
};

/**
 * Send invitation
 * @param {Member} member
 * @param {Space} space
 * @param {Array<{ userId, phone }>} users
 * @returns {Promise<Member[]>}
 */
const sendInvitations = async (member, space, users) => {
  const createdBy = member.userId;
  const invitations = await Promise.all(
    users.map(async (user) => {
      try {
        const invitation = await createInvitation(user, space.spaceId, createdBy);
        return invitation;
      } catch (err) {
        logger.error(err);
        return null;
      }
    })
  );

  return invitations.filter((inv) => !!inv);
};

const isInvitationExpired = (member) => {
  const today = new Date();
  const invitationExpiredDate = member.expiredAt;

  return today > invitationExpiredDate;
};

/**
 * Accept Invitation
 * @param {Member} member
 * @param {Space} space
 * @returns {Promise<{ space, members, users }>}
 */
const acceptSpaceInvitation = async (currentMember, space) => {
  if (
    currentMember.invitationStatus !== invitationStatusEnum.RECEIVED &&
    currentMember.invitationStatus !== invitationStatusEnum.SENDED
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This invitation is not in a valid status.');
  }
  if (isInvitationExpired(currentMember)) {
    await MemberRepository.updateInvitationStatus(
      currentMember.memberId,
      invitationStatusEnum.EXPIRED,
      currentMember.userId
    );
    memberNotification.memberUpdated(space.spaceId, currentMember.memberId);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation expired.');
  }

  let members = await MemberRepository.findBySpaceIdAndInvitationStatusAccepted(space.spaceId);
  members = members.filter((m) => m.userId !== currentMember.userId);

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

  await MemberRepository.updateInvitationStatus(currentMember.memberId, invitationStatusEnum.ACCEPTED, currentMember.userId);
  Object.assign(currentMember, { invitationStatus: invitationStatusEnum.ACCEPTED });
  memberNotification.memberUpdated(space.spaceId, currentMember.memberId);

  return { space, members: [...members, currentMember], users };
};

/**
 * Reject Invitation
 * @param {Member} member
 * @param {Space} space
 * @returns {Promise<{ member }>}
 */
const rejectSpaceInvitation = async (member, space) => {
  if (member.invitationStatus === invitationStatusEnum.RECEIVED) {
    await MemberRepository.updateInvitationStatus(member.memberId, invitationStatusEnum.REJECTED, member.userId);
    Object.assign(member, { invitationStatus: invitationStatusEnum.REJECTED });
    memberNotification.memberUpdated(space.spaceId, member.memberId);
  }

  return { member };
};

/**
 * Update member
 * @param {User} currentUser
 * @param {Space} space
 * @param {String} memberId
 * @param {{ role, name }} memberInfo
 * @returns {Promise<String>}
 */
const updateMember = async (currentUser, space, memberId, memberInfo) => {
  const { name, role } = memberInfo;
  const member = await MemberRepository.findById(memberId);
  if (member) {
    await MemberRepository.update(memberId, name, role, currentUser.userId);
    memberNotification.memberUpdated(space.spaceId, memberId);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This user is not a member of this space.');
  }
};

/**
 * Get member
 * @param {String} memberId
 * @returns {Promise<{ member, user }>}
 */
const getMember = async (memberId) => {
  const member = await MemberRepository.findAnyMemberById(memberId);
  const user = await UserRepository.findById(member.userId);

  return { member, user };
};

/**
 * Delete member
 * @param {String} memberId
 * @param {User} currentUser
 * @param {Space} space
 * @returns {Promise<{ member }>}
 */
const deleteMember = async (memberId, currentUser, space) => {
  const member = await MemberRepository.findById(memberId);

  if (member && member.invitationStatus === invitationStatusEnum.ACCEPTED) {
    await MemberRepository.delete(memberId, currentUser.userId);
    Object.assign(member, { deleted: true });
    memberNotification.memberUpdated(space.spaceId, member.memberId);
    memberNotification.memberDeleted(space.spaceId, member.userId, memberId);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This user is not a member of this space.');
  }
  return { member };
};

/**
 * Cancel invitation
 * @param {String} memberId
 * @param {User} currentUser
 * @param {Space} space
 * @returns {Promise<{ member }>}
 */
const cancelInvitation = async (memberId, currentUser, space) => {
  const member = await MemberRepository.findById(memberId);

  if (member.invitationStatus === invitationStatusEnum.SENDED || member.invitationStatus === invitationStatusEnum.RECEIVED) {
    await MemberRepository.updateInvitationStatus(memberId, invitationStatusEnum.CANCELED, currentUser.userId);
    Object.assign(member, { invitationStatus: invitationStatusEnum.CANCELED });
    memberNotification.memberUpdated(space.spaceId, memberId);
    memberNotification.invitationCanceled(space.spaceId, member.userId, memberId);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This member already accept the invitation');
  }
  return { member };
};

/**
 * Leave space
 * @param {Space} space
 * @param {Member} member
 * @returns {Promise<Boolean>}
 */
const leaveSpace = async (space, member) => {
  await MemberRepository.delete(member.memberId, member.userId);

  const members = await MemberRepository.findBySpaceIdAndInvitationStatusAccepted(space.spaceId);
  if (members.length > 0) {
    if (member.role === spaceRoleEnum.ADMIN && members.every((m) => m.role !== spaceRoleEnum.ADMIN)) {
      const [oldestMember] = members;
      await MemberRepository.update(oldestMember.memberId, oldestMember.name, spaceRoleEnum.ADMIN, member.userId);
      memberNotification.memberUpdated(space.spaceId, oldestMember.memberId);
    }

    memberNotification.memberUpdated(space.spaceId, member.memberId);
  }

  return true;
};

module.exports = {
  sendInvitations,
  acceptSpaceInvitation,
  rejectSpaceInvitation,
  updateMember,
  getMember,
  deleteMember,
  cancelInvitation,
  leaveSpace,
};
