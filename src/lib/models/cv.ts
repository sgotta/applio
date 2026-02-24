import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const PersonalInfoSchema = new Schema(
  {
    fullName: String,
    jobTitle: String,
    photoUrl: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    website: String,
    summary: String,
  },
  { _id: false },
);

const SettingsSchema = new Schema(
  {
    colorScheme: String,
    fontFamily: String,
    theme: String,
    locale: String,
    fontSizeLevel: Number,
    pattern: {
      type: new Schema(
        {
          name: String,
          scope: String,
          sidebarIntensity: Number,
          mainIntensity: Number,
        },
        { _id: false },
      ),
    },
  },
  { _id: false },
);

const VisibilitySchema = new Schema(
  {
    location: Boolean,
    linkedin: Boolean,
    website: Boolean,
    summary: Boolean,
    courses: Boolean,
    certifications: Boolean,
    awards: Boolean,
  },
  { _id: false },
);

const SidebarSectionSchema = new Schema(
  {
    sectionId: String,
    sortOrder: Number,
  },
  { _id: false },
);

const ExperienceSchema = new Schema({
  company: String,
  position: String,
  startDate: String,
  endDate: String,
  description: String,
  sortOrder: Number,
});

const EducationSchema = new Schema({
  institution: String,
  degree: String,
  startDate: String,
  endDate: String,
  description: String,
  sortOrder: Number,
});

const SkillItemSchema = new Schema({
  name: String,
  sortOrder: Number,
});

const SkillCategorySchema = new Schema({
  name: String,
  sortOrder: Number,
  items: [SkillItemSchema],
});

const CertificationSchema = new Schema({
  name: String,
  issuer: String,
  date: String,
  description: String,
  sortOrder: Number,
});

const CourseSchema = new Schema({
  name: String,
  institution: String,
  date: String,
  description: String,
  sortOrder: Number,
});

const AwardSchema = new Schema({
  name: String,
  issuer: String,
  date: String,
  description: String,
  sortOrder: Number,
});

const PurchaseSchema = new Schema(
  {
    isPaid: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ["stripe", "mercadopago", "paypal"],
    },
    paymentId: String,
    paidAt: Date,
  },
  { _id: false },
);

// ---------------------------------------------------------------------------
// Main CV document
// ---------------------------------------------------------------------------

export interface ICV extends Document {
  userId: Types.ObjectId;
  title: string;
  slug?: string;
  isPublished: boolean;
  version: number;
  personalInfo: {
    fullName?: string;
    jobTitle?: string;
    photoUrl?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    summary?: string;
  };
  settings: {
    colorScheme?: string;
    fontFamily?: string;
    theme?: string;
    locale?: string;
    fontSizeLevel?: number;
    pattern?: {
      name?: string;
      scope?: string;
      sidebarIntensity?: number;
      mainIntensity?: number;
    };
  };
  visibility: {
    location?: boolean;
    linkedin?: boolean;
    website?: boolean;
    summary?: boolean;
    courses?: boolean;
    certifications?: boolean;
    awards?: boolean;
  };
  sidebarSections: Array<{ sectionId: string; sortOrder: number }>;
  experiences: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    sortOrder?: number;
  }>;
  education: Array<{
    institution?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    sortOrder?: number;
  }>;
  skillCategories: Array<{
    name?: string;
    sortOrder?: number;
    items: Array<{ name?: string; sortOrder?: number }>;
  }>;
  certifications: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    description?: string;
    sortOrder?: number;
  }>;
  courses: Array<{
    name?: string;
    institution?: string;
    date?: string;
    description?: string;
    sortOrder?: number;
  }>;
  awards: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    description?: string;
    sortOrder?: number;
  }>;
  purchase: {
    isPaid: boolean;
    provider?: "stripe" | "mercadopago" | "paypal";
    paymentId?: string;
    paidAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CVSchema = new Schema<ICV>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    slug: { type: String, unique: true, sparse: true },
    isPublished: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    personalInfo: PersonalInfoSchema,
    settings: SettingsSchema,
    visibility: VisibilitySchema,
    sidebarSections: [SidebarSectionSchema],
    experiences: [ExperienceSchema],
    education: [EducationSchema],
    skillCategories: [SkillCategorySchema],
    certifications: [CertificationSchema],
    courses: [CourseSchema],
    awards: [AwardSchema],
    purchase: {
      type: PurchaseSchema,
      default: () => ({ isPaid: false }),
    },
  },
  { timestamps: true },
);

const CV: Model<ICV> =
  mongoose.models.CV || mongoose.model<ICV>("CV", CVSchema);

export default CV;
