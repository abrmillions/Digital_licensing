import { NextResponse } from "next/server";
import { DJANGO_API_URL } from "@/lib/config/django-api";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const src = url.searchParams;
    const licenseNumber = src.get("license_number") || src.get("licenseNumber");
    const token = src.get("token");

    const qp = new URLSearchParams();
    if (licenseNumber) {
      qp.set("license_number", licenseNumber);
      qp.set("licenseNumber", licenseNumber);
    }
    if (token) qp.set("token", token);

    const endpoint = `${DJANGO_API_URL}/api/licenses/verify/${qp.toString() ? `?${qp.toString()}` : ""}`;
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const bodyText = await resp.text();
    return new Response(bodyText, {
      status: resp.status,
      headers: {
        "content-type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { valid: false, detail: e?.message || "Proxy verification error" },
      { status: 500 },
    );
  }
}
