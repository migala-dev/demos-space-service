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
const UserRepository = require('../shared/repositories/user.repository');
const MemberRepository = require('../shared/repositories/member.repository');
const { User } = require('../shared/models');
const { spaceRoleEnum, invitationStatusEnum } = require('../shared/enums');
const logger = require('../shared/config/logger');
const memberNotification = require('../shared/notifications/members.notification');
const { getSpacesData } = require('./space.service');

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
 * @returns {Promise<{
 *      users: User[],
 *      spaces: Space[],
 *      members: Member[],
 *      proposals: Proposal[],
 *      proposalParticipation: ProposalParticipation[],
 *      proposalVotes: ProposalVote[],
 *      manifestos: Manifesto[],
 *      manifesto_options: ManifestoOption[],
 *      manifesto_comments: ManifestoComment[],
 *      manifesto_comment_votes: ManifestoCommentVote[],
 *  }>}
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

  let {
    members,
    users,
    proposals,
    proposalParticipations,
    proposalVotes,
    manifestos,
    manifestoOptions,
    manifestoComments,
    manifestoCommentVotes,
  } = await getSpacesData([space.spaceId]);
  members = members.filter((m) => m.userId !== currentMember.userId);

  await MemberRepository.updateInvitationStatus(currentMember.memberId, invitationStatusEnum.ACCEPTED, currentMember.userId);
  Object.assign(currentMember, { invitationStatus: invitationStatusEnum.ACCEPTED });
  memberNotification.memberUpdated(space.spaceId, currentMember.memberId);

  return {
    space,
    members: [...members, currentMember],
    users,
    proposals,
    proposalParticipations,
    proposalVotes,
    manifestos,
    manifestoOptions,
    manifestoComments,
    manifestoCommentVotes,
  };
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
 * Get all members phoneNumbers
 * @param {Space} space
 * @returns {Promise<{ memberPhoneNumbers: { memberId: string, phoneNumber: string }[] }>}
 */
const getMembersPhoneNumber = async (space) => {
  const memberPhoneNumbers = await MemberRepository.findMemberPhoneNumbers(space.spaceId);

  return { memberPhoneNumbers };
};

/**
 * Get member
 * @param {String} memberId
 * @returns {Promise<{ member, user }>}
 */
const getMember = async (memberId) => {
  const member = await MemberRepository.findAnyMemberById(memberId);
  const user = await UserRepository.findById(member.userId);
  delete user.phoneNumber;

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
  } else {
    await deleteInvitations(space);
  }

  return true;
};

const deleteInvitations = async space => {
  const invitedMembers = await MemberRepository.findBySpaceIdAndInvitationStatusSendedOrReceived(
    space.spaceId
  );

  return Promise.all(invitedMembers.map(member => 
    MemberRepository.delete(member.memberId, member.userId)
  ));
};

module.exports = {
  sendInvitations,
  acceptSpaceInvitation,
  rejectSpaceInvitation,
  updateMember,
  getMembersPhoneNumber,
  getMember,
  deleteMember,
  cancelInvitation,
  leaveSpace,
};
