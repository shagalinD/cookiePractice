const express = require('express')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')
const app = express()

// Директория для кэша
const CACHE_DIR = path.join(__dirname, 'cache')
const CACHE_FILE = path.join(CACHE_DIR, 'data-cache.json')
const CACHE_TTL = 60 * 1000

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

const users = new Map()

// Мидлвары
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use(
  session({
    secret: 'super_duper_cool_secret_keeeeeeeeeeyyyy',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
)

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res
      .status(401)
      .json({ success: false, error: 'Требуется авторизация' })
  }
  next()
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Логин и пароль обязательны',
    })
  }

  if (users.has(username)) {
    return res.status(409).json({
      success: false,
      error: 'Пользователь уже существует',
    })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    users.set(username, { username, password: hashedPassword })

    req.session.user = { username }

    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    })
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Логин и пароль обязательны',
    })
  }

  const user = users.get(username)

  if (!user) {
    if (username === 'admin' && password === '12345') {
      req.session.user = { username }
      return res.json({ success: true })
    }

    return res.status(401).json({
      success: false,
      error: 'Неверные учетные данные',
    })
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные',
      })
    }

    req.session.user = { username }

    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    })
  }
})

app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user })
  }
  res.json({ authenticated: false })
})

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Ошибка выхода',
      })
    }
    res.clearCookie('connect.sid')
    res.json({ success: true })
  })
})

app.get('/data', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация',
      })
    }

    if (fs.existsSync(CACHE_FILE)) {
      const fileContent = fs.readFileSync(CACHE_FILE, 'utf-8')
      const cachedData = JSON.parse(fileContent)

      const now = Date.now()
      if (now - cachedData.createdAt < CACHE_TTL) {
        return res.json({
          success: true,
          data: cachedData.data,
          timestamp: cachedData.timestamp,
          fromCache: true,
        })
      }
    }

    const now = new Date()
    const newData = {
      data: `Ваши данные: ${Math.random().toString(36).substring(2, 15)}`,
      timestamp: now.toLocaleString(),
      createdAt: now.getTime(),
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(newData), 'utf-8')

    res.json({
      success: true,
      data: newData.data,
      timestamp: newData.timestamp,
      fromCache: false,
    })
  } catch (error) {
    console.error('Ошибка получения данных:', error)
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
  console.log('Для демо-доступа используйте:')
  console.log('Логин: admin')
  console.log('Пароль: 12345')
})
