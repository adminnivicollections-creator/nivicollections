import "server-only";

// Verified against the real API before writing this: /courier/track/awb/{awb}
// returns tracking_data.shipment_track[0] with current_status, courier_name,
// destination and edd (estimated delivery date) even for an AWB Shiprocket
// doesn't recognise — it just comes back with those fields empty, which is
// what `found: false` below is keying off.

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_API_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket is not configured.");
  }

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Shiprocket auth failed (${res.status})`);

  const data = await res.json();
  if (!data.token) throw new Error("Shiprocket auth did not return a token.");

  // Shiprocket tokens last ~10 days; re-authenticate a little early rather
  // than race the exact expiry.
  cachedToken = { value: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cachedToken.value;
}

export type ShipmentStatus = {
  found: boolean;
  status: string;
  courierName: string;
  destination: string;
  estimatedDelivery: string | null;
  deliveredDate: string | null;
};

/** Returns found: false rather than throwing when the AWB is unrecognised. */
export async function trackShipment(awbCode: string): Promise<ShipmentStatus> {
  const token = await getToken();

  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Shiprocket tracking failed (${res.status})`);

  const data = await res.json();
  const track = data?.tracking_data?.shipment_track?.[0];

  if (!track || !track.current_status) {
    return {
      found: false,
      status: "",
      courierName: "",
      destination: "",
      estimatedDelivery: null,
      deliveredDate: null,
    };
  }

  return {
    found: true,
    status: track.current_status,
    courierName: track.courier_name || "",
    destination: track.destination || "",
    estimatedDelivery: track.edd || null,
    deliveredDate: track.delivered_date || null,
  };
}
