import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { sendSlackAlert, formatStaleOrderAlert } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const pendingOrders = await getPendingOrders(db);
  const stale = pendingOrders.filter((o) => o.days_since_created > 3);

  if (stale.length === 0) {
    console.log("No orders pending longer than 3 days.");
    return;
  }

  console.log(`Orders pending longer than 3 days (${stale.length}):`);
  for (const order of stale) {
    console.log(
      `  #${order.order_id} | ${order.customer_name} | ${order.phone ?? "no phone"} | $${order.total_amount} | ${Math.floor(order.days_since_created)} days`
    );
  }

  const message = formatStaleOrderAlert(stale);
  await sendSlackAlert(message);
  console.log("Slack alert sent to #order-alerts.");
}

main();
