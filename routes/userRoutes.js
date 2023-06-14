const express = require('express');

const userController = require('./../controllers/userController');

const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

// everything below this middleware will be protected
router.use(authController.protect);

router.put('/updateMyPassword', authController.updatePassword);

router.put('/updateMe', userController.updateMe);

router.put('/deleteMe', userController.deleteMe);

// everything below this middleware will be restricted to admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
