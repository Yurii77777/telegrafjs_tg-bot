const { Markup } = require('telegraf');

import { User } from '../../model/user.model';

import { UserService } from '../user.service';
import { TelegramUtilsService } from '../telegram.service/telegramUtils.service';

export class TelegramActionsService {
  private userService: UserService;
  private telegramUtilsService: TelegramUtilsService;

  constructor() {
    this.userService = new UserService();
    this.telegramUtilsService = new TelegramUtilsService();
  }
}
