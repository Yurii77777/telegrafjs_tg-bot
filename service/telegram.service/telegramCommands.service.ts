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
      {
        command: '/update_user',
        description: 'Оновити дані | Update user',
      },
    ]);
  }

  async handleStartCommand(ctx) {
    // Розкоментуйте рядок нижче, щоб побачити дані
    // Виведіть весь ctx, а не лише вкладені секції
    // console.log('[ctx.update.message in start command]', ctx?.update?.message);

    // Дістаємо необхідні нам дані із ctx
    // Для зручності id перейменуємо в chatId
    const { id: chatId, first_name, username } = ctx?.update?.message?.chat;

    // Робимо запит до бази даних для пошуку такого користувача
    let user: null | User = null;

    try {
      user = await this.userService.getUser({ chatId });
    } catch (error) {
      // Якщо ми потрапили в дану секцію, значить запит до БД впав
      // Про це необхідно сповістити користувача, оскільки він то не знає цього
      // Для цого ми смотрюємо окремий метод, щоб було зручно відправляти повідомлення
      // в залежності від обраної мови користувачем
      // Але в даному випадку, ми не знайшли юзера, тому за замовчуванням ставимо ENG
      ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));
    }

    // Якщо користувача не має в базі даних
    if (!user) {
      // Створюємо нового користувачв в базі даних
      try {
        await this.userService.createUser({ chatId, telegramName: first_name || username });
      } catch (error) {
        // Якщо щось піде не так, то ми опинимося тут
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

        // Далі нічого не робимо, оскільки користувач повинен почати все спочатку
        return;
      }

      // Формуємо наше повідомлення для відповіді юзеру із окремих сегментів, для наглядності
      let messageToUser = this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'SUCCESS_USER_CREATE',
      });
      messageToUser += `${this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'YOUR_CHATID',
      })}${chatId}\n`;
      messageToUser += `${this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'YOUR_NAME',
      })}${first_name || username}\n`;

      // Бот надсилає повідомлення про успіх,
      // оскільки якщо ми дійшли сюди, то користувач був створений в базі даних!
      try {
        ctx.reply(messageToUser);
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }
    }
    // Обробники для користувача, який вже є в базі даних
    else {
      const { chatId, telegramName } = user;

      // Формуємо наше повідомлення для відповіді юзеру із окремих сегментів, для наглядності
      let messageToUser = this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'RETRIVED_USER_PROFILE',
      });
      messageToUser += `${this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'YOUR_CHATID',
      })}${chatId}\n`;
      messageToUser += `${this.telegramUtilsService.setBotMessage({
        lang: 'UA',
        message: 'YOUR_NAME',
      })}${telegramName}\n`;

      // Бот надсилає повідомлення про успіх
      try {
        ctx.reply(messageToUser);
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }
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
