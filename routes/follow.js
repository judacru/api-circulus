const express = require('express')
const router = express.Router()
const FollowController = require('../app/controllers/FollowController')
const check = require('../middlewares/auth')

const followController = new FollowController()

router.post('/save', check.auth, followController.create)
router.get('/following/:id?/:page?', check.auth, followController.following)
router.get('/followers/:id?/:page?', check.auth, followController.followers)
router.delete('/unfollow/:id', check.auth, followController.unfollow)

module.exports = router
