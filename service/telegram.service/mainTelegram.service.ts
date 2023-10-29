const { Scenes, session } = require('telegraf');

import { bot } from '../../config/telegram.config';

import { TelegramCommandsService } from './telegramCommands.service';

export class TelegramService {
  private telegramCommandsService: TelegramCommandsService;

  constructor() {
    this.telegramCommandsService = new TelegramCommandsService();
  }

  async handleBotEvents() {
    try {
      await this.telegramCommandsService.setBotCommands();
    } catch (error) {
      console.log('[error]', error);
    }

    bot.command('start', async (ctx: any) => {
      try {
        await this.telegramCommandsService.handleStartCommand(ctx);
      } catch (error) {
        console.log('Error handleStartCommand :::', error);
      }
    });

    bot.launch();
  }
}
