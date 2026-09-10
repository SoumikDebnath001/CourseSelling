export * from "./api";

export interface Sponsor {
  _id: string;
  name: string;
  imageUrl?: { url: string; publicId: string };
  websiteUrl?: string;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
}
