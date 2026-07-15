import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { CertificateIssued } from "../models/CertificateIssued";

/** Strict shape of a printed certificate id, e.g. "OGR-2026-0001". */
const CERT_ID_RE = /^OGR-\d{4}-\d{4,8}$/;

/**
 * PUBLIC: verify a certificate by the id printed on it (reached by scanning the
 * QR code on the certificate). Deliberately returns ONLY the five public fields
 * shown on the verification page — generation date, course id, course name,
 * certificate id and student name — and nothing else (no emails, no user ids,
 * no enumeration help). Rate-limited at the route.
 */
export const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const certificateId = String(req.params.certificateId ?? "").trim().toUpperCase();
  if (!CERT_ID_RE.test(certificateId)) {
    throw new ApiError(400, "Invalid certificate id format");
  }

  const cert = await CertificateIssued.findOne({ certificateId })
    .select("certificateId studentName courseName course issuedAt")
    .lean();
  if (!cert) throw new ApiError(404, "Certificate not found");

  res.json({
    success: true,
    certificate: {
      certificateId: cert.certificateId,
      studentName: cert.studentName ?? "",
      courseName: cert.courseName,
      courseId: String(cert.course),
      issuedAt: cert.issuedAt,
    },
  });
});
