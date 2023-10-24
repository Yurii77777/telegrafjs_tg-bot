import { model, Schema, Model, Document } from 'mongoose';

export interface User extends Document {
  chatId?: number;
  telegramName?: string;
  phone?: string;
  language?: string;
  location?: string;
}

const UserSchema: Schema = new Schema(
  {
    chatId: {
      type: Number,
      required: false,
      unique: false,
      sparse: true,
    },
    telegramName: {
      type: String,
      required: false,
      minLength: 2,
      maxLength: 100,
      sparse: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      set: (phone: string) => phone.replace(/\D/g, ''),
    },
    language: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

export const UserModel: Model<User> = model<User>('User', UserSchema);
