const { Scenes, session } = require('telegraf');

import { bot } from '../../config/telegram.config';

import { TelegramCommandsService } from './telegramCommands.service';
import { TelegramUtilsService } from './telegramUtils.service';
import { TelegramActionsService } from './telegramActions.service';
import { TelegramUpdateUserScene } from './scenes/updateUserScene.service';
import { TelegramAddPostScene } from './scenes/addPostScene.service';

import { UserService } from '../user.service';
import { TELEGRAM_BOT_SCENES } from '../../constants/telegramBotScenes';
import { TELEGRAM_BOT_BTN_ACTIONS } from '../../constants/telegramBotBtnActions';

export class TelegramService {
  private telegramCommandsService: TelegramCommandsService;
  private telegramUtilsService: TelegramUtilsService;
  private telegramActionsService: TelegramActionsService;
  private telegramUpdateUserScene: TelegramUpdateUserScene;
  private telegramAddPostScene: TelegramAddPostScene;
  private userService: UserService;

  constructor() {
    this.telegramCommandsService = new TelegramCommandsService();
    this.telegramUtilsService = new TelegramUtilsService();
    this.telegramActionsService = new TelegramActionsService();
    this.telegramUpdateUserScene = new TelegramUpdateUserScene();
    this.telegramAddPostScene = new TelegramAddPostScene();
    this.userService = new UserService();
  }

  async handleBotEvents() {}
}
