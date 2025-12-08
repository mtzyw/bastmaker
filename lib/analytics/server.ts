"use server";

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GOOGLE_ID;
const GA_API_SECRET = process.env.GA_API_SECRET;

type PaymentSuccessPayload = {
  userId: string;
  clientId?: string;
  planId?: string | null;
  priceId?: string | null;
  referenceId?: string | null;
  orderType?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  eventName?: string;
};

async function sendMeasurementProtocolEvent(body: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
    return;
  }

  try {
    const response = await fetch(
      `${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      console.error("[analytics] Measurement Protocol request failed:", errorText);
    }
  } catch (error) {
    console.error("[analytics] Failed to send Measurement Protocol event:", error);
  }
}

export async function trackPaymentSuccess({
  userId,
  clientId,
  planId,
  priceId,
  referenceId,
  orderType,
  amountTotal,
  currency,
  eventName,
}: PaymentSuccessPayload) {
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
    return;
  }

  const effectiveClientId = clientId ?? `user-${userId}`;

  const params: Record<string, unknown> = {
    plan_id: planId ?? undefined,
    price_id: priceId ?? undefined,
    reference_id: referenceId ?? undefined,
    order_type: orderType ?? undefined,
    currency: currency ?? undefined,
  };

  if (typeof amountTotal === "number") {
    params.value = amountTotal;
  }

  const body = {
    client_id: effectiveClientId,
    user_id: userId,
    events: [
      {
        name: eventName ?? "payment_success",
        params,
      },
    ],
  };

  await sendMeasurementProtocolEvent(body);
}
