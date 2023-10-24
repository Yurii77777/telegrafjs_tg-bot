import { connect } from '../config/db.config';

import { User, UserModel } from '../model/user.model';

export class UserRepository {
  constructor() {
    connect();
  }

  async createUser(user): Promise<User> {
    let data: null | User = null;

    try {
      data = await UserModel.create(user);
    } catch (error) {
      console.log('Error createUser::', error);
    }

    return data;
  }

  async getUser(crm): Promise<User> {
    let data: null | User = null;

    try {
      data = await UserModel.findOne(crm);
    } catch (error) {
      console.log('Error getUser::', error);
    }

    return data;
  }

  async updateUser(user, update): Promise<User> {
    let data: null | User = null;

    try {
      data = await UserModel.findOneAndUpdate(user, update, { useFindAndModify: false, new: true });
    } catch (error) {
      console.log('Error getUser::', error);
    }

    return data;
  }

  async deleteUser(shop): Promise<{ status: boolean }> {
    let data: any = {};

    try {
      data = await UserModel.deleteOne(shop);
    } catch (error) {
      console.log('Error getUser::', error);
    }

    return { status: data.deletedCount > 0 ? true : false };
  }
}
