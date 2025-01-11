const express = require('express')
const router = express.Router()
const PublicationController = require('../app/controllers/PublicationController')
const check = require('../middlewares/auth')
const multer = require('multer')

const publicationController = new PublicationController()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/publications/')
  },

  filename: (req, file, cb) => {
    cb(null, 'pub-' + Date.now() + '-' + file.originalname)
  },
})

const uploads = multer({ storage })

router.post('/save', check.auth, publicationController.save)
router.post(
  '/upload/:id',
  [check.auth, uploads.single('file0')],
  publicationController.upload,
)
router.get('/detail/:id', check.auth, publicationController.detail)
router.get('/user/:id/:page?', check.auth, publicationController.user)
router.get('/media/:file', publicationController.media)
router.get('/feed/:page?', check.auth, publicationController.feed)
router.delete('/remove/:id', check.auth, publicationController.remove)

module.exports = router
