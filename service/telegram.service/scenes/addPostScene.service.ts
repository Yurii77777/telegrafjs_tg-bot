const { Scenes, Markup } = require('telegraf');

import { UserService } from '../../user.service';
import { TelegramUtilsService } from '../telegramUtils.service';

import { User } from '../../../model/user.model';

import { TELEGRAM_BOT_SCENES } from '../../../constants/telegramBotScenes';
import { TELEGRAM_BOT_BTN_ACTIONS } from '../../../constants/telegramBotBtnActions';

export class TelegramAddPostScene {
  private userService: UserService;
  private telegramUtilsService: TelegramUtilsService;

  constructor() {
    this.userService = new UserService();
    this.telegramUtilsService = new TelegramUtilsService();
  }

  addPostScene = new Scenes.WizardScene(
    TELEGRAM_BOT_SCENES.ADD_POST,

    async (ctx: any) => {
      // Дістаємо chatId користувача
      const chatId: number = ctx?.message?.chat?.id;

      // Шукаємо такого користувача в БД
      let user: null | User = null;

      try {
        user = await this.userService.getUser({ chatId });
      } catch (error) {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

        // Якщо отримали помилку, подальші дії не мають сенсу
        // І робимо не просто return, а виводимо користувача із даної сцени
        return ctx.scene.leave();
      }

      // Якщо користувача не має, відповідно він не може публікувати пост в канал
      if (!user) {
        try {
          ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'UA', message: 'USER_NOT_FOUND' }));
        } catch (error) {
          console.log('[Error send message] ::: ', error);
        }

        // Якщо користувача не має, подальші дії не мають сенсу
        // І робимо не просто return, а виводимо користувача із даної сцени
        return ctx.scene.leave();
      }

      // На даному етапі ми точно знаємо, що у нас є такий користувач
      // Звісно варто додатково перевірити роль юзера, чи є в нього такі права на публікацію в канал
      // Створюємо стор 'userData' для зберігання необхідних даних
      // котрі ми будемо збирати по мірі просування по крокам даної сцени
      ctx.wizard.state.userData = {};
      ctx.wizard.state.userData.chatId = chatId;
      ctx.wizard.state.userData.lang = user.language;

      // Просимо користувача завантажити зображення майбутнього поста
      try {
        await ctx.reply(this.telegramUtilsService.setBotMessage({ lang: user.language, message: 'UPLOAD_PHOTO' }));
      } catch (error) {
        console.log('sendMessage :::', error.message);
      }

      // Переводимо користувача на наступний крок даної сцени
      return ctx.wizard.next();
    },

    async (ctx: any) => {
      // Дістаємо із нашого стору мову користувача
      const { lang } = ctx.wizard.state.userData;
      // Отримуємо фото, які завантажив користувач
      const userPhotos = ctx?.update?.message?.photo;
      // console.log('[userPhotos]', userPhotos);
      const isUserPhotos = userPhotos && !!userPhotos.length;

      // Якщо масив фотограцій пустий, це означає що користувач не завантажив фото
      if (!isUserPhotos) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_PHOTO_UPLOAD' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо його на крок назад, щоб він все ж таки мав змогу
        // спробувати ще раз завантажити зображення
        return;
      }

      // Дістаємо останнє зображення завантажене користувачем, а саме його file_id
      const { file_id } = userPhotos[userPhotos.length - 1];

      // Дістаємо URL даного зображення
      const { href: fileUrl } = await ctx.telegram.getFileLink(file_id);
      // console.log('[fileUrl]', fileUrl);

      // Додаємо отримані дані в наш стор
      ctx.wizard.state.userData.fileId = file_id;
      ctx.wizard.state.userData.fileUrl = fileUrl;

      // Просимо користувача ввести текстовий опис для посту
      try {
        await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ADD_DESCRIPTION' }));
      } catch (error) {
        console.log('sendMessage :::', error.message);
      }

      // Переводимо користувача на наступний крок даної сцени
      return ctx.wizard.next();
    },

    async (ctx: any) => {
      // Дістаємо із нашого стору мову, chatId та fileId
      const { lang, chatId, fileId } = ctx.wizard.state.userData;
      // Тут буде тестове повідомлення надіслане користувачем
      const postMessage: string = ctx?.message?.text;

      // Тут в ідеалі зробити декілька перевірок
      // Перша, чи був введений текст користувачем
      // можливо він зробив не пойми що і ми тут текст не отримаємо
      if (!postMessage) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_POST_MESSAGE' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо його на крок назад, щоб він все ж таки мав змогу
        // спробувати ще раз ввести текст (опис для поста)
        return;
      }

      // Якщо текст починається зі слешу "/"
      // це означає, що юзер пішов клацати меню бота
      const isBotMenuCommand = postMessage.startsWith('/');

      if (isBotMenuCommand) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_POST_MESSAGE' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо його на крок назад, щоб він все ж таки мав змогу
        // спробувати ще раз ввести текст (опис для поста)
        return;
      }

      // Також варто додати перевірку на довжину тексту
      const isValidMessageLength = postMessage.length >= 10;

      if (!isValidMessageLength) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_POST_MESSAGE' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо його на крок назад, щоб він все ж таки мав змогу
        // спробувати ще раз ввести текст (опис для поста)
        return;
      }

      // Для того, щоб зкоротити кількість коду
      // всі ці три перевірки можна зклеїти в один if та записати універсальний текст відповіді

      // На даному етапі текст введений користувачем пройшов всі перевірки
      // І ми можемо сфорумати preview майбутнього посту для підтвердження публікації

      // Формуємо клавіатуру із двох кнопок Так і Ні
      const keyboard = [
        [
          Markup.button.callback(
            this.telegramUtilsService.setBotMessage({ lang, message: 'YES' }),
            TELEGRAM_BOT_BTN_ACTIONS.YES,
          ),
          Markup.button.callback(
            this.telegramUtilsService.setBotMessage({ lang, message: 'NO' }),
            TELEGRAM_BOT_BTN_ACTIONS.NO,
          ),
        ],
      ];

      // До тексту, який ввів користувач додаємо свій текст
      // Наш текст буде ЛИШЕ у preview
      const updatedMessageForApprove =
        postMessage + '\n\n' + this.telegramUtilsService.setBotMessage({ lang, message: 'APPROVE_POST' });

      // Відправляємо сформований preview на погодження юзеру
      try {
        await ctx.telegram.sendPhoto(chatId, fileId, {
          // Опис = текстове повідомлення
          caption: updatedMessageForApprove,
          // Додаємо нашу клавіатуру
          ...Markup.inlineKeyboard(keyboard),
          // Додаємо збереження форматування тексту
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.log('[error send preview message]', error);

        // Оскільки дана дія не була виконана, виводимо користувача зі сцени
        return ctx.scene.leave();
      }

      // Додаємо опис для посту в наш стор
      ctx.wizard.state.userData.postMessage = postMessage;

      // Переводимо користувача на наступний крок даної сцени
      return ctx.wizard.next();
    },

    async (ctx: any) => {
      // Дістаємо із нашого стору мову, chatId, fileId та postMessage
      const { lang, chatId, fileId, postMessage } = ctx.wizard.state.userData;
      // Отримуємо клік по кнопці із попередньої сцени
      const selectedAction: string = ctx?.update?.callback_query?.data;

      // Якщо користувач проігнорував і не натиснув на кнопку
      // сповіщаємо його про це і переводимо на крок назад
      // щоб він мав змогу обрати дію
      if (!selectedAction) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_CHOOSE_ACTION' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо користувача на крок назад
        return;
      }

      // Якщо користувач обрав Ні
      if (selectedAction === TELEGRAM_BOT_BTN_ACTIONS.NO) {
        // Сповіщаємо його про те що публікація посту анулюьована
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'CANCEL_POST' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Виводимо його зі сцени
        return ctx.scene.leave();
      }

      // Якщо ми дійшли до даного етапу,
      // значить ми маємо згоду на публікацію від користувача

      // Відправляємо пост в канал
      let message = null;
      try {
        message = await ctx.telegram.sendPhoto(process.env.PUBLIC_CHANNEL, fileId, {
          // Опис = текстове повідомлення
          caption: postMessage,
          // Додаємо збереження форматування тексту
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.log('[error send preview message]', error);

        // Оскільки дана дія не була виконана, виводимо користувача зі сцени
        return ctx.scene.leave();
      }

      // Збираємо посилання на пост в каналі
      // щоб надіслати його користувачеві
      const messageUrl = 'https://t.me/' + process.env.PUBLIC_CHANNEL.replace('@', '') + '/' + message.message_id;

      // Готуємо відформатоване повідомлення на юзера
      const messageForUser = this.telegramUtilsService.setBotMessage({
        lang,
        message: 'POST_SUCCESS_POSTED_TO_SELLER',
      });
      const messageToReply = messageForUser.replace(
        '<URL>',
        `<a href="${messageUrl}">${this.telegramUtilsService.setBotMessage({ lang, message: 'LINK' })}</a>`,
      );

      // Відправляємо звротній зв'язок про успішну публікацію в каналі
      try {
        await ctx.reply(messageToReply, {
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.log('sendMessage :::', error.message);
      }

      // Виводимо користувача зі сцени
      return ctx.scene.leave();
    },
  );
}
