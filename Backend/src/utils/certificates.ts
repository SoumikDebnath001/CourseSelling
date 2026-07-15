import { Types } from "mongoose";
import { CertificateIssued } from "../models/CertificateIssued";
import { CertificateRecord } from "../models/CertificateRecord";
import { ExistingUser } from "../models/external/ExistingUser";
import { OnlinePlatformUser } from "../models/OnlinePlatformUser";

/**
 * The student's name/email for the certificate registry (shown on the QR verify
 * page). Learners can live in EITHER the shared academy `users` collection
 * (ExistingUser) OR this app's own online-signup collection (OnlinePlatformUser)
 * — check both so every certificate carries the right name.
 */
async function certificateHolder(userId: Types.ObjectId): Promise<{ name?: string; email?: string }> {
  const member = await ExistingUser.findById(userId).select("name email").lean();
  if (member) return { name: member.name, email: member.email };
  const online = await OnlinePlatformUser.findById(userId).select("name email").lean();
  return { name: online?.name, email: online?.email };
}

/** The fields of a certificate record the serial allocator needs. */
interface CertLike {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  course: Types.ObjectId;
  courseName: string;
  level: string;
  label?: string;
  serial?: string;
  issuedAt?: Date;
}

/** All certificate dates/serial years follow Kenya time, wherever the server runs. */
export const CERTIFICATE_TIMEZONE = "Africa/Nairobi";

/** The calendar year of a moment in Kenya (Africa/Nairobi) time. */
export function nairobiYear(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: CERTIFICATE_TIMEZONE, year: "numeric" }).format(d));
}

/**
 * Returns the permanent certificate id (OGR-YEAR-0001 style) for a certificate
 * record, allocating the next sequential number for the year on first call.
 * The year segment follows Kenya (Africa/Nairobi) time and rolls over
 * automatically at the Nairobi new year. Subsequent calls (re-downloads) always
 * return the same id — the registry entry in CertificateIssued is the source of
 * truth and is never rewritten.
 */
export async function ensureCertificateSerial(cert: CertLike): Promise<string> {
  if (cert.serial) return cert.serial;

  const stamp = async (id: string) => {
    await CertificateRecord.updateOne({ _id: cert._id }, { serial: id });
    return id;
  };

  const existing = await CertificateIssued.findOne({ certificate: cert._id }).lean();
  if (existing) return stamp(existing.certificateId);

  const issuedAt = cert.issuedAt ?? new Date();
  const year = nairobiYear(issuedAt);
  const user = await certificateHolder(cert.userId);

  // The unique index on certificateId makes concurrent allocation safe: on a
  // collision we recount and try the next number.
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await CertificateIssued.countDocuments({ certificateId: new RegExp(`^OGR-${year}-`) });
    const certificateId = `OGR-${year}-${String(count + 1).padStart(4, "0")}`;
    try {
      await CertificateIssued.create({
        certificateId,
        userId: cert.userId,
        studentName: user.name,
        studentEmail: user.email,
        course: cert.course,
        courseName: cert.courseName,
        certificate: cert._id,
        level: cert.level,
        label: cert.label,
        issuedAt,
      });
      return stamp(certificateId);
    } catch (err) {
      if ((err as { code?: number })?.code === 11000) {
        // Raced another allocation. If it was for this same record, reuse it.
        const again = await CertificateIssued.findOne({ certificate: cert._id }).lean();
        if (again) return stamp(again.certificateId);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not allocate a certificate id");
}
