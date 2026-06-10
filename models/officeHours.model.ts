import { Schema, model, Document } from "mongoose";

export type DayStatus = "open" | "closed" | "half-day" | "custom";

export interface IDaySchedule {
  day: string;
  dayOrder: number;
  openTime: string;
  closeTime: string;
  status: DayStatus;
  customLabel?: string;
}

export interface IOfficeHours extends Document {
  schedule: IDaySchedule[];
}

const dayScheduleSchema = new Schema<IDaySchedule>(
  {
    day: { type: String, required: true },
    dayOrder: { type: Number, required: true },
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "18:00" },
    status: {
      type: String,
      enum: ["open", "closed", "half-day", "custom"],
      default: "open",
    },
    customLabel: { type: String, default: "" },
  },
  { _id: false }
);

const DEFAULT_SCHEDULE: IDaySchedule[] = [
  { day: "Monday",    dayOrder: 0, openTime: "09:00", closeTime: "18:00", status: "open" },
  { day: "Tuesday",   dayOrder: 1, openTime: "09:00", closeTime: "18:00", status: "open" },
  { day: "Wednesday", dayOrder: 2, openTime: "09:00", closeTime: "18:00", status: "open" },
  { day: "Thursday",  dayOrder: 3, openTime: "09:00", closeTime: "18:00", status: "open" },
  { day: "Friday",    dayOrder: 4, openTime: "09:00", closeTime: "18:00", status: "open" },
  { day: "Saturday",  dayOrder: 5, openTime: "09:00", closeTime: "13:00", status: "open" },
  { day: "Sunday",    dayOrder: 6, openTime: "09:00", closeTime: "18:00", status: "closed" },
];

const officeHoursSchema = new Schema<IOfficeHours>(
  {
    schedule: { type: [dayScheduleSchema], default: () => DEFAULT_SCHEDULE },
  },
  { timestamps: true }
);

export const OfficeHours = model<IOfficeHours>("OfficeHours", officeHoursSchema);
