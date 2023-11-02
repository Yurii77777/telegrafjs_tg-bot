const { Scenes, session } = require('telegraf');

import { bot } from '../../config/telegram.config';

import { TelegramCommandsService } from './telegramCommands.service';
import { TelegramUpdateUserScene } from './scenes/updateUserScene.service';
import { TelegramAddPostScene } from './scenes/addPostScene.service';
import { TELEGRAM_BOT_SCENES } from '../../constants/telegramBotScenes';

export class TelegramService {
  private telegramCommandsService: TelegramCommandsService;
  private telegramUpdateUserScene: TelegramUpdateUserScene;
  private telegramAddPostScene: TelegramAddPostScene;

  constructor() {
    this.telegramCommandsService = new TelegramCommandsService();
    this.telegramUpdateUserScene = new TelegramUpdateUserScene();
    this.telegramAddPostScene = new TelegramAddPostScene();
  }

  async handleBotEvents() {
    try {
      await this.telegramCommandsService.setBotCommands();
    } catch (error) {
      console.log('[error]', error);
    }

    const scenes = new Scenes.Stage([
      this.telegramUpdateUserScene.updateUserScene,
      this.telegramAddPostScene.addPostScene,
    ]);

    // Scenes
    bot.use(session());
    bot.use(scenes.middleware());

    bot.command('start', async (ctx: any) => {
      try {
        await this.telegramCommandsService.handleStartCommand(ctx);
      } catch (error) {
        console.log('Error handleStartCommand :::', error);
      }
    });

    bot.command('set_language', async (ctx: any) => {
      try {
        await this.telegramCommandsService.setLanguage(ctx);
      } catch (error) {
        console.log('Error setLanguage :::', error);
      }
    });

    bot.command('update_user', async (ctx: any) => {
      try {
        await ctx.scene.enter(TELEGRAM_BOT_SCENES.UPDATE_USER);
      } catch (error) {
        console.log(`[Error ${TELEGRAM_BOT_SCENES.UPDATE_USER}] :::`, error);
      }
    });

    bot.command('add_post', async (ctx: any) => {
      try {
        await ctx.scene.enter(TELEGRAM_BOT_SCENES.ADD_POST);
      } catch (error) {
        console.log(`[Error ${TELEGRAM_BOT_SCENES.ADD_POST}] :::`, error);
      }
    });

    bot.launch();
  }
}
