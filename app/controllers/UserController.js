const bcrypt = require('bcrypt')
const jwt = require('../../app/services/jwt')
const fs = require('fs').promises
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const followService = require('../services/FollowService')
const prisma = new PrismaClient()

class UserController {
  create = async (req, res) => {
    try {
      let params = req.body

      if (!params.name || !params.nick || !params.email || !params.password) {
        return res.status(400).json({
          status: 'error',
          message: 'Faltan datos por enviar',
        })
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              email: {
                equals: params.email.toLowerCase(),
              },
            },
            {
              nick: {
                equals: params.nick.toLowerCase(),
              },
            },
          ],
        },
      })

      if (users && users.length >= 1) {
        return res.status(200).json({
          status: 'error',
          message: 'El usuario ya existe',
        })
      }

      const pwd = await bcrypt.hash(params.password, 10)
      params.password = pwd

      const userStored = await prisma.user.create({
        data: {
          name: params.name,
          surname: params.surname,
          bio: params.bio,
          nick: params.nick,
          email: params.email,
          password: params.password,
        },
      })

      return res.status(200).json({
        status: 'success',
        message: 'Usuario registrado correctamente',
        userStored,
      })
    } catch (error) {
      console.error('Error:', error)
      return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error',
        error: error.message,
      })
    }
  }

  login = async (req, res) => {
    const { email, password } = req.body

    try {
      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
        },
      })

      if (!user) {
        return res.status(404).send({
          status: 'error',
          message: 'El usuario no existe',
        })
      }

      const pwd = bcrypt.compareSync(password, user.password)
      if (!pwd) {
        return res.status(400).send({
          status: 'error',
          message: 'Contraseña inválida',
        })
      }

      const token = jwt.createToken(user)

      return res.status(200).send({
        status: 'success',
        message: 'Te has identificado correctamente',
        user: {
          id: user.id,
          name: user.name,
          nick: user.nick,
        },
        token,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error',
        error: error.message,
      })
    }
  }

  profile = async (req, res) => {
    try {
      const id = parseInt(req.params.id)

      const userProfile = await prisma.user.findFirst({
        where: {
          id: id, // Usar el id como número entero
        },
        select: {
          id: true,
          name: true,
          surname: true,
          bio: true,
          nick: true,
          email: true,
          image: true,
          createdAt: true,
          followings: true,
          followers: true,
          publications: true,
        },
      })
      if (!userProfile || userProfile.length === 0) {
        return res.status(404).send({
          status: 'error',
          message: 'El usuario no existe',
        })
      }

      //Informacion de follows

      const followInfo = await followService.followThisUser(req.user.id, id)

      return res.status(200).send({
        status: 'success',
        user: userProfile,
        following: followInfo.following,
        follower: followInfo.follower,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error',
        error: error.message,
      })
    }
  }

  list = async (req, res) => {
    try {
      let page = 1
      if (req.params.page) {
        page = parseInt(req.params.page)
      }

      let itemsPerPage = 5

      const users = await prisma.user.findMany({
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          surname: true,
          nick: true,
          email: true,
          image: true,
          createdAt: true,
        },
      })

      const totalUsers = await prisma.user.count()

      if (!users || users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'No hay usuarios disponibles',
        })
      }

      const followInfo = await followService.followUserIds(req.user.id)

      return res.status(200).json({
        status: 'success',
        users,
        page,
        itemsPerPage,
        totalUsers,
        pages: Math.ceil(totalUsers / itemsPerPage),
        following: followInfo.following,
        follower: followInfo.followers,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error',
        error: error.message,
      })
    }
  }

  update = async (req, res) => {
    try {
      let userIdentity = req.user
      let userToUpdate = req.body

      delete userIdentity.iat
      delete userIdentity.exp
      delete userIdentity.role
      delete userIdentity.image

      const existingUser = await prisma.user.findMany({
        where: {
          OR: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() },
          ],
          NOT: { id: userIdentity.id },
        },
      })

      if (existingUser.length > 0) {
        return res.status(200).json({
          status: 'success',
          message: 'El usuario ya existe',
        })
      }

      if (userToUpdate.password) {
        const hashedPassword = await bcrypt.hash(userToUpdate.password, 10)
        userToUpdate.password = hashedPassword
      } else {
        delete userToUpdate.password
      }

      const updatedUser = await prisma.user.update({
        where: { id: userIdentity.id },
        data: userToUpdate,
      })

      return res.status(200).json({
        status: 'success',
        message: 'Usuario actualizado',
        user: updatedUser,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error',
        error: error.message,
      })
    }
  }

  upload = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({
          status: 'error',
          message: 'Petición no incluye la imagen',
        })
      }

      const image = req.file.originalname
      const imageSplit = image.split('.')
      const extension = imageSplit[imageSplit.length - 1].toLowerCase()

      if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        const filePath = req.file.path
        fs.unlinkSync(filePath)

        return res.status(400).send({
          status: 'error',
          message: 'Extensión del fichero inválida',
        })
      }

      const userUpdated = await prisma.user.update({
        where: { id: req.user.id },
        data: { image: req.file.filename },
      })

      return res.status(200).send({
        status: 'success',
        user: userUpdated,
        file: req.file,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error en la subida del avatar',
        error: error.message,
      })
    }
  }

  avatar = async (req, res) => {
    try {
      const file = req.params.file
      const filePath = './uploads/avatars/' + file

      try {
        await fs.access(filePath)
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'La imagen no existe',
        })
      }

      return res.sendFile(path.resolve(filePath))
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al recuperar la imagen',
        error,
      })
    }
  }

  counters = async (req, res) => {
    let userId = req.user.id

    if (req.params.id) {
      userId = parseInt(req.params.id) // Asegúrate de que sea un entero si el ID es numérico
    }

    try {
      const following = await prisma.follow.count({
        where: { userId: userId },
      })

      const followed = await prisma.follow.count({
        where: { followedId: userId },
      })

      const publications = await prisma.publication.count({
        where: { userId: userId },
      })

      return res.status(200).send({
        userId,
        following: following,
        followed: followed,
        publications: publications,
      })
    } catch (error) {
      return res.status(500).send({
        status: 'error',
        message: 'Error en los contadores',
        error: error.message,
      })
    }
  }
}
module.exports = UserController
