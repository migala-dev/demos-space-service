const express = require('express');
const auth = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const spaceValidation = require('../../validations/space.validation');
const spaceController = require('../../controllers/space.controller');
const { uploadSpacePictureS3 } = require('../../config/s3');

const router = express.Router();

router.post('/', auth(), validate(spaceValidation.creation), spaceController.create);
router.route('/:spaceId/picture').post(auth(), uploadSpacePictureS3.single('file'), spaceController.uploadPicture);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: spaces
 *   description: Spaces
 */

/**
 * @swagger
 * /spaces:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *             example:
 *               phoneNumber: +526545384736
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       "401":
 *         description: Invalid phoneNumber
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid phoneNumber
 */
