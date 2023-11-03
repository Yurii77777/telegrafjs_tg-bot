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
      {
        command: '/add_post',
        description: 'Додати пост | Add post',
      },
      {
        command: '/add_to_google_sheets',
        description: 'Записати до Таблиці | Write to the Table',
      },
      {
        command: '/get_from_google_sheets',
        description: 'Зчитати дані із Таблиці | Read from the Table',
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

  async sendUserDataToGoogleSheets(ctx) {
    // Дістаємо chatId користувача
    // Само собою, в першу чергу потрібно зрозуміти чи є у нас БД такий користувач
    const { id: chatId } = ctx?.update?.message?.chat;
    let user: null | User = null;

    try {
      user = await this.userService.getUser({ chatId });
    } catch (error) {
      ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

      return;
    }

    // Якщо користувача не має
    if (!user) {
      try {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'UA', message: 'USER_NOT_FOUND' }));
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }

      // Закінчуємо виконання даного методу
      return;
    }

    // Тут у нас точно є користувач
    // дістаємо його дані
    const { telegramName, phone, language, location } = user;

    try {
      // URL до нашої апп в Гугл Таблиці виносимо в env
      // для зручності обслуговування
      const { status } = await axios.post(`${process.env.GOOGLE_SHEETS_APP_URL}`, {
        // Як пам'ятаєте в скрипті Гугл таблиці ми очікуємо userData
        // Це масив значень, кожне значенння окрема колонка
        userData: [telegramName, phone, language, location],
      });

      // Якщо ми отримали статус !== 200, а ми в скриптах вказали 400-й у разі помилки
      // відповідно про це необхідно сповістити користувача
      if (status !== 200) {
        return await ctx.reply(
          this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_ADD_DATA_TO_GOOGLE_SHEETS' }),
        );
      }

      // Ну і тут ми отримали успіх і також необхідно повідомити про це користувача
      await ctx.reply(
        this.telegramUtilsService.setBotMessage({ lang: language, message: 'SUCCESS_POST_TO_GOOGLE_SHEETS' }),
      );
    } catch (error) {
      console.log('[error]', error);

      // У випадку аксіос помилки запиту
      // також сповіщаємо користувача
      return await ctx.reply(
        this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_ADD_DATA_TO_GOOGLE_SHEETS' }),
      );
    }
  }

  async getDataFromGoogleSheets(ctx) {
    // Дістаємо chatId користувача
    // Само собою, в першу чергу потрібно зрозуміти чи є у нас БД такий користувач
    // разом із тим потрібно передбачити чи є у такого користувача доступ до зчитування даних
    const { id: chatId } = ctx?.update?.message?.chat;
    let user: null | User = null;

    try {
      user = await this.userService.getUser({ chatId });
    } catch (error) {
      ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

      return;
    }

    // Якщо користувача не має
    if (!user) {
      try {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'UA', message: 'USER_NOT_FOUND' }));
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }

      // Закінчуємо виконання даного методу
      return;
    }

    // Тут у нас точно є користувач
    // дістаємо його дані
    const { language } = user;
    let googleData = null;

    try {
      // До нашого URL додаємо квері параметр sheetName
      // і підставлємо назву Листа із якого необхідно зчитати дані
      const { data, status } = await axios.get(`${process.env.GOOGLE_SHEETS_APP_URL}?sheetName=Sheet1`);

      // Це статус запиту в самому аксіос
      if (status !== 200) {
        return await ctx.reply(
          this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_GET_DATA_TO_GOOGLE_SHEETS' }),
        );
      }

      const { status: GoogleScriptStatus, data: GoogleSheetData } = data;

      // Це статус, який ми прописали в скриптах в Гугл Таблиці
      if (GoogleScriptStatus !== 200) {
        return await ctx.reply(
          this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_GET_DATA_TO_GOOGLE_SHEETS' }),
        );
      }

      googleData = GoogleSheetData;
    } catch (error) {
      return await ctx.reply(
        this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_GET_DATA_TO_GOOGLE_SHEETS' }),
      );
    }

    if (!googleData) {
      try {
        await ctx.reply(
          this.telegramUtilsService.setBotMessage({ lang: language, message: 'ERROR_GET_DATA_TO_GOOGLE_SHEETS' }),
        );
      } catch (error) {
        console.log('sendMessage', error);
      }

      // Завершуємо виконання методу, оскільки даних ми не отримали
      return;
    }

    // Тут у нас точно є дані які ми можемо надіслати користувачу
    // У відповідь приходить масив масивів
    // де кожен вкладений масив, то окремий рядок із таблиці
    const [messageToUser] = googleData.map((tableRow) => tableRow.join(', '));

    try {
      await ctx.reply(messageToUser, { parse_mode: 'HTML' });
    } catch (error) {
      console.log('sendMessage', error);
    }
  }
}
