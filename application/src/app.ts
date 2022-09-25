import express, { NextFunction, Request, Response } from 'express'

require('express-async-errors')
import createError from 'http-errors'
import path from 'path'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import compression from 'compression'
import session from 'express-session'

import config from '../config'
import { APIError } from './routes/api/APIResult'
import WWWRouter from './routes/www'
import AdminRouter from './routes/admin'
import APIRouter from './routes/api'
import { swaggerUI, specs } from './swagger'

const MySQLStore = require('express-mysql-session')(session)

const sessionDBOptions = {
  host: config.DOMAIN_MYSQL_HOST,
  port: config.DOMAIN_MYSQL_PORT,
  database: config.DOMAIN_MYSQL_SESSION_DB,
  user: config.DOMAIN_MYSQL_USER,
  password: config.DOMAIN_MYSQL_PASSWORD
}

class App {
  public app: express.Application
  public APP_SECRET = config.APP_SECRET
  public static PROJECT_DIR = config.PROJECT_DIR

  constructor() {
    this.app = express()
  }

  public setup() {
    this.config()
    this.setupRoutes()
  }

  /**
   * Express Configuration
   */
  private config() {
    this.app.use(compression())

    // Session
    const sessionStore = new MySQLStore(sessionDBOptions)
    this.app.use(
      session({
        secret: this.APP_SECRET,
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
      })
    )

    // View Engine - EJS Template
    this.app.set('views', path.join(config.PROJECT_DIR, 'views'))
    this.app.set('view engine', 'ejs')

    // Logger
    this.app.use(morgan('combined'))

    // Express
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(cookieParser(this.APP_SECRET))
    this.app.use(express.static(path.join(config.PROJECT_DIR, 'public')))
  }

  /**
   * Routes Configuration
   */
  private setupRoutes() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.url = req.originalUrl
      res.locals.host = req.get('host')
      res.locals.protocol = req.protocol
      next()
    })

    // Routes
    new APIRouter().routes('/api', this.app)
    new WWWRouter().routes('/', this.app)
    new AdminRouter().routes('/admin', this.app)

    // Swagger
    this.app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs))

    // Error
    this.app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        next(createError(404))
      }
    )

    this.app.use((err: any, req: express.Request, res: express.Response) => {
      if (
        err instanceof APIError ||
        (err instanceof Error && req.path.startsWith('/api/'))
      ) {
        App.handleApiError(err, req, res)
      } else {
        App.handleWebError(err, req, res)
      }
    })
  }

  private static handleApiError(
    err: any,
    _: express.Request,
    res: express.Response
  ): void {
    res.status(err.status ? err.status : 500).json({
      success: false,
      code: err.code ? err.code : 500,
      message: err.message
    })
  }

  private static handleWebError(
    err: any,
    req: express.Request,
    res: express.Response
  ): void {
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    res.status(err.status || 500)
    res.render('error')
  }
}

export default App
