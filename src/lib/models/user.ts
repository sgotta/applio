import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  locale?: string;
  theme?: string;
  subscription: {
    plan: "free" | "pro";
    billingInterval?: "monthly" | "yearly";
    provider?: "stripe" | "mercadopago" | "paypal";
    customerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    billingInterval: {
      type: String,
      enum: ["monthly", "yearly"],
    },
    provider: {
      type: String,
      enum: ["stripe", "mercadopago", "paypal"],
    },
    customerId: String,
    subscriptionId: String,
    currentPeriodEnd: Date,
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: String,
    emailVerified: Date,
    image: String,
    locale: String,
    theme: String,
    subscription: {
      type: SubscriptionSchema,
      default: () => ({ plan: "free" }),
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
