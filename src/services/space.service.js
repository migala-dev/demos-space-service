const httpStatus = require('http-status');
const ApiError = require('../shared/utils/ApiError');

/**
 * Update user by cognito id
 * @param {ObjectId} cognitoId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const create = async () => {
  throw new ApiError(httpStatus.NOT_FOUND, 'Not implemented yet');
};

/* const removeOldImage = (imageKey) => {
  s3.deleteObject(
    {
      Bucket: config.aws.bucket,
      Key: imageKey,
    },
    function (err) {
      if (err) {
        logger.error(`Can not delete: ${imageKey}`);
        logger.error(`${err}`);
      }
    }
  );
}; */

/**
 * Upload an avatar image
 * @param {String} cognitoId
 * @param {File} file
 * @returns {Promise<String>}
 */
const uploadImage = async () => {
  /*  const user = await getUserByCognitoId(cognitoId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const oldImageKey = user.profilePictureKey;
  const profilePictureKey = file.key;
  Object.assign(user, { profilePictureKey });
  const userToUpdate = new User();
  userToUpdate.profilePictureKey = profilePictureKey;
  await UserRepository.save(user.userId, userToUpdate);
  removeOldImage(oldImageKey);
  return user; */
  throw new ApiError(httpStatus.NOT_FOUND, 'Not implemented yet');
};

module.exports = {
  create,
  uploadImage,
};
