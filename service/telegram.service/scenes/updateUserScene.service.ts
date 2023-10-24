const { Scenes } = require('telegraf');

import { UserService } from '../../user.service';
import { TelegramUtilsService } from '../telegramUtils.service';

import { User } from '../../../model/user.model';

import { TELEGRAM_BOT_SCENES } from '../../../constants/telegramBotScenes';

export class TelegramUpdateUserScene {
  private userService: UserService;
  private telegramUtilsService: TelegramUtilsService;

  constructor() {
    this.userService = new UserService();
    this.telegramUtilsService = new TelegramUtilsService();
  }

  updateUserScene = new Scenes.WizardScene(
    TELEGRAM_BOT_SCENES.USER_REGISTER,

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

      // Якщо користувача не має, відповідно нікому оновлювати дані
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
      // Створюємо стор 'userData' для зберігання необхідних даних
      // котрі ми будемо збирати по мірі просування по крокам даної сцени
      ctx.wizard.state.userData = {};
      ctx.wizard.state.userData.chatId = chatId;
      ctx.wizard.state.userData.userId = user._id;
      ctx.wizard.state.userData.lang = user.language;

      // Просимо користувача поділитися (пошарити) своїм номером телефону
      // Для цього створюємо клавіатуру із параметром 'request_contact'
      const keyboard = [
        [
          {
            text: this.telegramUtilsService.setBotMessage({ lang: user.language, message: 'SHARE_PHONE_NUMBER' }),
            request_contact: true,
          },
        ],
      ];

      // Відправляємо дану кнопку користувачеві
      try {
        await ctx.reply(
          this.telegramUtilsService.setBotMessage({ lang: user.language, message: 'SHARE_PHONE_PARAGRAPH' }),
          {
            reply_markup: { keyboard },
          },
        );
      } catch (error) {
        console.log('sendMessage :::', error.message);
      }

      // Переводимо користувача на наступний крок даної сцени
      return ctx.wizard.next();
    },

    async (ctx: any) => {
      // Саме тут ми отримаємо номер телефону користувача,
      // якщо він надав свою згоду (підтвердження)
      const userPhone: string = ctx?.update?.message?.contact?.phone_number;
      // Дістаємо із нашого стору мову користувача
      const { lang } = ctx.wizard.state.userData;

      // Першим ділом завжди перевіряємо чи є там якість дані
      if (!userPhone) {
        // Відправляємо повідомлення про помилку
        // Приміром користувач вводив номер телефону звичайним повідомленням
        // але нам це на підходить
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_USER_PHONE' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // ВАЖЛИВО! Тут робимо звичайний return
        // Таким чином ми повертаємо користувача на попередній крок даної сцени
        // І він знову зможе поділитися номером телефону
        // Інакше вся логіка посиплеться оскільки JS працює зверху вниз!
        return;
      }

      // Тут у нас точно є номер телефону користувача
      // відповідно ми додаємо його до нашого стору
      ctx.wizard.state.userData.userPhone = userPhone;

      // Відправляємо запит, щоб користувач поділився своєю гео-локацією
      // Для цього створюємо клавіатуру із параметром 'request_location'
      const keyboard = [
        [
          {
            text: this.telegramUtilsService.setBotMessage({ lang, message: 'SHARE_LOCATION' }),
            request_location: true,
          },
        ],
      ];

      // Відправляємо дану кнопку користувачеві
      try {
        await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'SHARE_LOCATION_PARAGRAPH' }), {
          reply_markup: { keyboard },
        });
      } catch (error) {
        console.log('sendMessage :::', error.message);
      }

      // Переводимо користувача на наступний крок даної сцени
      return ctx.wizard.next();
    },

    async (ctx: any) => {
      // Дістаємо із нашого стору мову користувача
      const { lang } = ctx.wizard.state.userData;
      // Тут буде локація користувача із запиту в попередньому кроці
      const userLocation: string = ctx?.update?.message?.location;

      // Локейшина не буде, якщо користувач не натисне на кнопку Поділитися локацією
      if (!userLocation) {
        try {
          await ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'ERROR_USER_LOCATION' }), {
            parse_mode: 'html',
          });
        } catch (error) {
          console.log('sendMessage :::', error.message);
        }

        // Повертаємо його на крок назад, щоб він все ж таки натиснув на кнопку
        // і ми змогли дістати звідти дані
        return;
      }

      // На даному етапі ми точно знаємо, що отримали локацію і можемо оновити дані користувача у нас в БД
      // Дістаємо з нашого стору, все що ми зібрали на попередніх кроках
      const { chatId, userPhone } = ctx.wizard.state.userData;

      // Оновлюємо юзера
      try {
        await this.userService.updateUser({ chatId }, { phone: userPhone, location: JSON.stringify(userLocation) });
      } catch (error) {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang: 'ENG', message: 'DB_REQUEST_ERROR' }));

        // Раптом трапиться помилка, виводимо юзера зі сцени
        return ctx.scene.leave();
      }

      // Відправляємо повідомлення користувачу про успшне оновлення даних
      try {
        ctx.reply(this.telegramUtilsService.setBotMessage({ lang, message: 'SUCCESS_USER_UPDATE' }), {
          // Видаляємо клавіатуру (кнопку), оскільки сама по собі вона не пропаде
          // а лише буде заважати під час взаємодії із ботом
          reply_markup: { remove_keyboard: true },
        });
      } catch (error) {
        console.log('[Error send message] ::: ', error);
      }

      return ctx.scene.leave();
    },
  );
}
