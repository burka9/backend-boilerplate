import express from 'express'
import helmet from 'helmet'
import { createServer } from 'http'
import morgan from 'morgan'
import cors from 'cors'
import { SERVER } from './common/env'
import logger from './common/logger'
import { RouteConfig } from './common/route.config'
import { errorHandler } from './middleware'
import { Database } from './database'

const routes: Array<RouteConfig> = []


// express configuration
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(helmet())
app.use(cors())
app.use(morgan('combined', {
	stream: {
		write: (message: string) => {
			logger.info(message.trim());
		},
	}
}))


// routes configuration
app.use(errorHandler)




// server configuration
const server = createServer(app)


const SERVER_CALLBACK = () => {
	logger.info(`server started `)
	logger.debug(`listening on ${SERVER.HOST}:${SERVER.PORT}`)

	routes.forEach(route => logger.info(`Route configured: ${route.name}`))
}

const SERVER_ERROR = (err: any) => {
	if (err.code === 'EADDRINUSE') {
		logger.info('Address in use, retrying...')
		setTimeout(() => {
			server.close()
			SERVER.PORT++
			server.listen(SERVER.PORT, SERVER.HOST)
		}, 1000)
	}
}



// database configuration
Database.initialize()
	.then(() => {
		logger.info('database connected')

		server
			.listen(SERVER.PORT, SERVER.HOST, SERVER_CALLBACK)
			.on('error', SERVER_ERROR)
	})
	.catch(err => {
		logger.error(err.toString())
		logger.error('database connection failed')
	})
