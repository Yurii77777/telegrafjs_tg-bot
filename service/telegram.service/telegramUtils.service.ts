const { Markup } = require('telegraf');

import { MESSAGES_UA } from './locales/messages_ua';
import { MESSAGES_ENG } from './locales/messages_eng';

const languages = {
  UA: MESSAGES_UA,
  ENG: MESSAGES_ENG,
};

export class TelegramUtilsService {
  setBotMessage(options: { lang: string; message: string }): string {
    const { lang, message } = options;

    if (!languages[lang]) {
      return 'Мова не підтримується!';
    }

    const botMessages = languages[lang];

    // Перевіряємо чи є таке повідомлення для обраної мови
    if (botMessages[message]) {
      return botMessages[message];
    } else {
      return 'Повідомлення не знайдено для обраної мови!';
    }
  }
}
