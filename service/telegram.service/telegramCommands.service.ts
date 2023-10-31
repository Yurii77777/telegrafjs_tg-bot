const { Markup } = require('telegraf');
const axios = require('axios');

import { bot } from '../../config/telegram.config';

import { User } from '../../model/user.model';

import { UserService } from '../user.service';
import { TelegramUtilsService } from '../telegram.service/telegramUtils.service';

import { TELEGRAM_BOT_BTN_ACTIONS } from '../../constants/telegramBotBtnActions';

export class TelegramCommandsService {
  private userService: UserService;
  private telegramUtilsService: TelegramUtilsService;

  constructor() {
    this.userService = new UserService();
    this.telegramUtilsService = new TelegramUtilsService();
  }

  async setBotCommands() {
    bot.telegram.setMyCommands([
      {
        command: '/start',
        description: "Для старту | Let's start",
      },
      {
        command: '/set_language',
        description: "Встановити мову бота | Set bot's language",
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

  async setLanguage(ctx) {
    // Само собою, в першу чергу потрібно зрозуміти чи є у нас БД такий користувач
    const { id: chatId } = ctx?.update?.message?.chat;
    let user: null | User = null;

    try {
      user = await this.userService.getUser({ chatId });
    } catch (error) {
      ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

      return;
    }

    // Якщо користувача не має, відповідно нікому встановлювати мову
    if (!user) {
      try {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'UA', message: 'USER_NOT_FOUND' }));
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }

      // Ще можна зробити такий підхід без секції else
      // просто заретьорнити подальше виконання коду
      return;
    }

    // Відповідно тут будуть обробники для користувача, який точно є у нас в БД
    // Створємо кнопки, масив масивів
    const keyboard = [
      [Markup.button.callback('Українська 🇺🇦', `${TELEGRAM_BOT_BTN_ACTIONS.SET_LANG}lang=UA`)],
      [Markup.button.callback('English 🇺🇸', `${TELEGRAM_BOT_BTN_ACTIONS.SET_LANG}lang=ENG`)],
    ];

    // Відправляємо їх користувачу
    try {
      await ctx.reply(
        // перший параметр - це текстове повідомлення
        this.telegramUtilsService.setBotMessage({ lang: 'UA', message: 'SET_LANGUAGE' }),
        // другий параметр inlineKeyboard
        Markup.inlineKeyboard(keyboard),
      );
    } catch (error) {
      console.log('[send keyboard setLanguage]', error.message);
    }
  }
}
