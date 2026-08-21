import express from 'express'
import { queryCertifications, getFacets, getHealth } from '../db/repository.js'

export const router = express.Router()

router.get('/certifications', (req, res) => {
  const { skill, type, level, q, page, pageSize } = req.query
  try {
    res.json(queryCertifications({ skill, type, level, q, page, pageSize }))
  } catch (error) {
    console.error('[api] certifications query failed:', error)
    res.status(500).json({ error: 'query failed' })
  }
})

router.get('/certifications/facets', (req, res) => {
  const { skill, type, level, q } = req.query
  try {
    res.json(getFacets({ skill, type, level, q }))
  } catch (error) {
    console.error('[api] facets query failed:', error)
    res.status(500).json({ error: 'query failed' })
  }
})

router.get('/health', (req, res) => {
  try {
    res.json({ status: 'ok', ...getHealth() })
  } catch (error) {
    console.error('[api] health check failed:', error)
    res.status(500).json({ status: 'error' })
  }
})
