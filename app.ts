import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');

import { TelegramService } from './service/telegram.service/mainTelegram.service';

class App {
  public express: express.Application;
  public telegramService: TelegramService;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.telegramService = new TelegramService();
    this.telegramService.handleBotEvents();
  }

  // Configure Express middleware.
  private middleware(): void {
    const corsOptions = {
      origin: '*',
      credentials: true, //access-control-allow-credentials:true
      optionSuccessStatus: 200,
    };

    this.express.use(cors(corsOptions));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    // For health check:
    this.express.get('/healthcheck', (req, res, next) => {
      res.send('Ok!');
    });

    // handle undefined routes
    this.express.use('*', (req, res, next) => {
      res.status(404).send('API endpoint not found');
    });
  }
}

export default new App().express;
