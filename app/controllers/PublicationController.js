const fs = require('fs').promises
const path = require('path')
const followService = require('../services/FollowService')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class PublicationController {
  save = async (req, res) => {
    try {
      const params = req.body

      if (!params.text) {
        return res.status(400).send({
          status: 'error',
          message: 'Debes enviar el texto de la publicación',
        })
      }

      const publication = await prisma.publication.create({
        data: {
          text: params.text,
          file: params.file || null,
          userId: req.user.id,
        },
      })

      return res.status(200).send({
        status: 'success',
        message: 'Publicación guardada con éxito',
        publication,
      })
    } catch (error) {
      return res.status(400).send({
        status: 'error',
        message: 'Error al guardar la publicación',
        error: error.message,
      })
    }
  }

  detail = async (req, res) => {
    try {
      const publicationId = req.params.id

      const publicationStore = await prisma.publication.findUnique({
        where: {
          id: publicationId,
        },
      })
      if (!publicationStore) {
        return res.status(400).send({
          status: 'error',
          message: 'No existe la publicación',
        })
      }

      return res.status(200).send({
        status: 'success',
        publicationStore,
      })
    } catch (error) {
      return res.status(400).send({
        status: 'error',
        message: 'Error al buscar la publicación',
        error,
      })
    }
  }

  remove = async (req, res) => {
    try {
      const publicationId = parseInt(req.params.id)
      const publicationDeleted = await prisma.publication.deleteMany({
        where: {
          id: publicationId,
          userId: req.user.id,
        },
      })
      if (publicationDeleted.count === 0) {
        return res.status(404).json({
          status: 'error',
          message:
            'No se encontró la publicación o ya se ha eliminado anteriormente.',
        })
      }

      return res.status(200).send({
        status: 'success',
        message: 'Publicacion eliminada con exito.',
        publicationId,
      })
    } catch (error) {
      return res.status(400).send({
        status: 'error',
        message: 'Error al buscar la publicación',
        error,
      })
    }
  }

  user = async (req, res) => {
    try {
      const userId = parseInt(req.params.id)
      let page = 1

      if (req.params.page) {
        page = parseInt(req.params.page)

        if (isNaN(page) || page <= 0) {
          page = 1
        }
      }

      const itemsPerPage = 5
      const skip = (page - 1) * itemsPerPage

      const publications = await prisma.publication.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: itemsPerPage,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nick: true,
              image: true,
            },
          },
        },
      })

      if (publications.length === 0) {
        return res.status(400).send({
          status: 'error',
          message: 'No hay publicaciones para mostrar',
        })
      }

      const total = await prisma.publication.count({
        where: { userId: userId },
      })

      return res.status(200).send({
        status: 'success',
        message: 'Publicaciones del perfil del usuario.',
        publications,
        page,
        total,
        pages: Math.ceil(total / itemsPerPage),
      })
    } catch (error) {
      return res.status(400).send({
        status: 'error',
        message: 'Error al buscar las publicaciones',
        error: error.message,
      })
    }
  }

  upload = async (req, res) => {
    try {
      const publicationId = parseInt(req.params.id)

      if (!req.file) {
        return res.status(400).send({
          status: 'error',
          message: 'Petición no incluye la imagen',
        })
      }

      let image = req.file.originalname

      let imageSplit = image.split('\.')
      let extension = imageSplit[1]

      if (
        extension != 'png' &&
        extension != 'jpg' &&
        extension != 'jpeg' &&
        extension != 'gif'
      ) {
        const filePath = req.file.path
        fs.unlink(filePath)

        return res.status(400).send({
          status: 'error',
          message: 'Extensión del fichero invalida',
        })
      }

      const publicationUpdated = await prisma.publication.updateMany({
        where: {
          id: publicationId,
          userId: req.user.id,
        },
        data: {
          file: req.file.filename,
        },
      })

      if (publicationUpdated.count === 0) {
        return res.status(404).send({
          status: 'error',
          message: 'No se encontró la publicación',
        })
      }

      return res.status(200).send({
        status: 'success',
        user: publicationUpdated,
        file: req.file,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error en la subida de la imagen',
        error: error.message,
      })
    }
  }

  media = async (req, res) => {
    try {
      const file = req.params.file
      const filePath = './uploads/publications/' + file

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

  feed = async (req, res) => {
    let page = 1
    if (req.params.page) page = req.params.page

    let itemsPerPage = 5

    try {
      const myFollows = await followService.followUserIds(req.user.id)
      const publications = await prisma.publication.findMany({
        where: {
          userId: {
            in: myFollows.following,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              nick: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      })

      return res.status(200).send({
        status: 'success',
        message: 'Feed de publicaciones',
        following: myFollows.following,
        publications,
      })
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'No se han listado las publicaciones del feed',
        error,
      })
    }
  }
}

module.exports = PublicationController
