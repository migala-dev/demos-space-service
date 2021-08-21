const AWS = require('aws-sdk');
const multer = require('multer');
const multers3 = require('multer-s3');
const config = require('./config');

const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

const uploadSpacePictureS3 = multer({
  storage: multers3({
    s3,
    acl: 'public-read',
    bucket: config.aws.bucket,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const { spaceId } = req.params;
      const splitFileName = file.originalname.split('.');
      const extension = splitFileName[splitFileName.length - 1];
      const randomNumber = new Date().getTime().toString().substr(9);
      cb(null, `spaces/${spaceId}.${randomNumber}.${extension}`);
    },
  }),
});

module.exports = {
  s3,
  uploadSpacePictureS3,
};
