const express = require('express');
const auth = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const spaceValidation = require('../../validations/space.validation');
const spaceController = require('../../controllers/space.controller');
const { uploadSpacePictureS3 } = require('../../middlewares/upload-file.middleware');

const router = express.Router();

router.post('/', auth(), validate(spaceValidation.creation), spaceController.create);
router.route('/:spaceId/picture').post(auth(), uploadSpacePictureS3.single('file'), spaceController.uploadPicture);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Spaces
 *   description: Spaces
 */

/**
 * @swagger
 * /spaces:
 *   post:
 *     summary: Create a space
 *     tags: [Spaces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - approvalPercentage
 *               - participationPercentage
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               approvalPercentage:
 *                 type: number
 *               participationPercentage:
 *                 type: number
 *             example:
 *               name: Nombre del espacio
 *               description: Descripcion del espacio
 *               approvalPercentage: 60
 *               participationPercentage: 60
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Space'
 *       "401":
 *         description: Invalid body information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid body information
 */

/**
 * @swagger
 * /spaces/:spaceId/picture:
 *   post:
 *     summary: Upload space picture
 *     tags: [Spaces]
 *     requestBody:
 *       required: true
 *       content:
 *        multipart/form-data:
 *          schema:
 *              type: string
 *              format: binary
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Space'
 *       "401":
 *         description: File is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: File is required
 */
