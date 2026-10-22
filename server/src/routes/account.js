import express from 'express'
import { clearSessionCookie } from '../auth/cookies.js'
import { requireAuth, requireCsrf } from '../auth/middleware.js'
import { verifyPassword } from '../auth/passwords.js'
import { clearLoginAttempts, loginRateLimit } from '../auth/rate-limit.js'
import { findUserByEmail } from '../auth/repository.js'
import { deleteAccount, getAccountOverview } from '../db/accountRepository.js'

export const accountRouter = express.Router()

// The logged-in user's own profile: account details and the personal data stored about them.
accountRouter.get('/account', requireAuth, async (req, res, next) => {
  try {
    const overview = await getAccountOverview(req.user.id)
    if (!overview) return res.status(404).json({ error: 'account not found' })
    res.json(overview)
  } catch (error) {
    next(error)
  }
})

// Permanently delete the logged-in user's account. The password is asked for again
// so an unattended, logged-in browser cannot be used to delete someone's account.
accountRouter.delete('/account', requireAuth, requireCsrf, loginRateLimit, async (req, res, next) => {
  try {
    const user = await findUserByEmail(req.user.email)
    if (!user || !verifyPassword(req.body?.password, user.passwordHash)) {
      return res.status(401).json({ error: 'incorrect password' })
    }
    clearLoginAttempts(req)
    await deleteAccount(user._id)
    clearSessionCookie(res)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})
