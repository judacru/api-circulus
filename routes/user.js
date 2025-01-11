const express = require('express')
const router = express.Router()
const multer = require('multer')
const UserController = require('../app/controllers/UserController')
const check = require('../middlewares/auth')

const userController = new UserController()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/avatars/')
  },

  filename: (req, file, cb) => {
    cb(null, 'avatar-' + Date.now() + '-' + file.originalname)
  },
})

const uploads = multer({ storage })

router.post('/create', userController.create)
router.post('/login', userController.login)
router.post(
  '/upload',
  [check.auth, uploads.single('file0')],
  userController.upload,
)
router.get('/profile/:id', check.auth, userController.profile)
router.get('/list/:page?', check.auth, userController.list)
router.get('/avatar/:file', userController.avatar)
router.put('/update', check.auth, userController.update)
router.get('/counters/:id', check.auth, userController.counters)

module.exports = router
