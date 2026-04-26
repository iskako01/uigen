interface StaleOrder {
  order_id: number;
  customer_name: string;
  phone: string | null;
  total_amount: number;
  days_since_created: number;
}

export function formatStaleOrderAlert(orders: StaleOrder[]): string {
  const lines = orders.map(
    (o) =>
      `• Order #${o.order_id} — *${o.customer_name}* | ${o.phone ?? "no phone"} | $${o.total_amount} | ${Math.floor(o.days_since_created)} days pending`
  );
  return [
    `*:warning: ${orders.length} order${orders.length === 1 ? "" : "s"} pending for more than 3 days:*`,
    ...lines,
  ].join("\n");
}

export async function sendSlackAlert(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL environment variable is not set");
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "#order-alerts", text: message }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status} ${res.statusText}`);
  }
}
