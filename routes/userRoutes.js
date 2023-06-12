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

router.route('/signup').post(authController.signup);

router.route('/login').post(authController.login);
module.exports = router;
