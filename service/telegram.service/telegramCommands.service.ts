const { Markup } = require('telegraf');
const axios = require('axios');

import { bot } from '../../config/telegram.config';

import { User } from '../../model/user.model';

import { UserService } from '../user.service';
// import { TelegramUtilsService } from '../telegram.service/telegramUtils.service';

import { TELEGRAM_BOT_BTN_ACTIONS } from '../../constants/telegramBotBtnActions';

export class TelegramCommandsService {
  private userService: UserService;
  // private telegramUtilsService: TelegramUtilsService;

  constructor() {
    this.userService = new UserService();
    // this.telegramUtilsService = new TelegramUtilsService();
  }

  async setBotCommands() {
    bot.telegram.setMyCommands([
      {
        command: '/start',
        description: "Для старту | Let's start",
      },
    ]);
  }

  async handleStartCommand(ctx) {
    try {
      await ctx.reply('Привіт!');
    } catch (error) {
      console.log('Error send message :::', error);
    }
  }
}
