const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class FollowService {
  followUserIds = async (identityUserId) => {
    try {
      const following = await prisma.follow.findMany({
        where: { userId: identityUserId },
        select: { followedId: true },
      })

      const followers = await prisma.follow.findMany({
        where: { followedId: identityUserId },
        select: { userId: true },
      })

      const following_clean = following.map((follow) => follow.followedId)
      const followers_clean = followers.map((follow) => follow.userId)

      return {
        following: following_clean,
        followers: followers_clean,
      }
    } catch (error) {
      throw new Error('Error al buscar los usuarios. ' + error.message)
    }
  }

  followThisUser = async (identityUserId, profileUserId) => {
    try {
      const following = await prisma.follow.findMany({
        where: {
          userId: identityUserId,
          followedId: profileUserId,
        },
      })

      const follower = await prisma.follow.findMany({
        where: {
          followedId: identityUserId,
          userId: profileUserId,
        },
      })

      return {
        following,
        follower,
      }
    } catch (error) {
      throw new Error('Error al verificar el seguimiento. ' + error.message)
    }
  }
}

module.exports = new FollowService()
