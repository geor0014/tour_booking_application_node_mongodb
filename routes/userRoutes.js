const express = require('express');
const userController = require('./../controllers/userController');
const router = express.Router();
const authController = require('./../controllers/authController');

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

router.put(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

router.put('/updateMe', authController.protect, userController.updateMe);

router.put('/deleteMe', authController.protect, userController.deleteMe);
module.exports = router;
