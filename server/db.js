import fs from 'fs'
import path from 'path'
import { config } from './config.js'

function ensureDbFileExists() {
  const dir = path.dirname(config.dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(config.dbPath)) {
    fs.writeFileSync(config.dbPath, JSON.stringify({}, null, 2), 'utf-8')
  }
}

export function readDb() {
  ensureDbFileExists()
  try {
    const raw = fs.readFileSync(config.dbPath, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch (err) {
    console.error('Error reading DB:', err)
    return {}
  }
}

export function writeDb(data) {
  ensureDbFileExists()
  try {
    fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Error writing DB:', err)
    return false
  }
}

export function getCollection(collectionName) {
  const db = readDb()
  return db[collectionName] || []
}

export function setCollection(collectionName, data) {
  const db = readDb()
  db[collectionName] = data
  return writeDb(db)
}

export function findById(collectionName, id) {
  const collection = getCollection(collectionName)
  if (Array.isArray(collection)) {
    return collection.find((item) => item.id === id)
  }
  return null
}

export function updateById(collectionName, id, updateFields) {
  const collection = getCollection(collectionName)
  if (!Array.isArray(collection)) return null

  const index = collection.findIndex((item) => item.id === id)
  if (index === -1) return null

  collection[index] = { ...collection[index], ...updateFields }
  setCollection(collectionName, collection)
  return collection[index]
}
