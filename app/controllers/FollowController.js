const { PrismaClient } = require('@prisma/client')
const followService = require('../services/FollowService')
const prisma = new PrismaClient()

class FollowController {
  constructor() {
    this.followService = followService
  }

  create = async (req, res) => {
    try {
      const params = req.body
      const identity = req.user

      const findFollow = await prisma.follow.findFirst({
        where: {
          userId: identity.id,
          followedId: params.followed,
        },
      })

      if (findFollow) {
        return res.status(400).send({
          status: 'error',
          message: 'Ya está siguiendo al usuario',
        })
      }

      const followStored = await prisma.follow.create({
        data: {
          userId: identity.id,
          followedId: params.followed,
        },
      })

      return res.status(200).send({
        status: 'success',
        message: 'Usuario seguido con éxito',
        followStored,
      })
    } catch (error) {
      return res.status(400).send({
        status: 'error',
        message: 'Error al seguir al usuario',
      })
    }
  }

  unfollow = async (req, res) => {
    try {
      const userId = req.user.id
      const followedId = req.params.id

      const followDeleted = await prisma.follow.deleteMany({
        where: {
          userId: userId,
          followedId: followedId,
        },
      })

      if (followDeleted.count === 0) {
        return res.status(404).json({
          status: 'error',
          message:
            'No se encontró el seguimiento o ya se ha eliminado anteriormente.',
        })
      }

      return res.status(200).json({
        status: 'success',
        message: 'Has dejado de seguir al usuario.',
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al dejar de seguir al usuario.',
        error,
      })
    }
  }

  following = async (req, res) => {
    try {
      const idUser = req.params.id ? parseInt(req.user.id) : req.params.id

      let page = 1

      if (req.params.page) page = parseInt(req.params.page)

      const itemsPerPage = 2

      const following = await prisma.follow.findMany({
        where: { userId: idUser },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        include: {
          followed: {
            select: {
              id: true,
              email: true,
              nick: true,
              name: true,
              image: true,
              createdAt: true,
            },
          },
        },
      })

      const total = await prisma.follow.count({
        where: { userId: idUser },
      })
      let followUserIds = await this.followService.followUserIds(req.user.id)

      return res.status(200).json({
        status: 'success',
        message: 'Listado de usuarios que estoy siguiendo.',
        following,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al buscar los usuarios.',
        error,
      })
    }
  }

  followers = async (req, res) => {
    try {
      const idUser = req.params.id ? parseInt(req.user.id) : req.params.id

      let page = 1

      if (req.params.page) page = parseInt(req.params.page)

      const itemsPerPage = 2

      const follows = await prisma.follow.findMany({
        where: { followedId: idUser },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nick: true,
              name: true,
              image: true,
              createdAt: true,
            },
          },
        },
      })

      const total = await prisma.follow.count({
        where: { followedId: idUser },
      })

      let followUserIds = await this.followService.followUserIds(req.user.id)

      return res.status(200).json({
        status: 'success',
        message: 'Listado de usuarios que me siguen.',
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al buscar los usuarios.',
        error,
      })
    }
  }
}

module.exports = FollowController
