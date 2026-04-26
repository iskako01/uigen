import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { formatStaleOrderAlert, sendSlackAlert } from "../slack";

const mockOrder = (overrides = {}) => ({
  order_id: 1,
  customer_name: "Jane Doe",
  phone: "555-1234",
  total_amount: 99.99,
  days_since_created: 4,
  ...overrides,
});

describe("formatStaleOrderAlert", () => {
  test("includes order count in header", () => {
    const msg = formatStaleOrderAlert([mockOrder()]);
    expect(msg).toContain("1 order");
  });

  test("pluralises for multiple orders", () => {
    const msg = formatStaleOrderAlert([mockOrder(), mockOrder({ order_id: 2 })]);
    expect(msg).toContain("2 orders");
  });

  test("includes customer name, phone, amount, and days", () => {
    const msg = formatStaleOrderAlert([mockOrder()]);
    expect(msg).toContain("Jane Doe");
    expect(msg).toContain("555-1234");
    expect(msg).toContain("99.99");
    expect(msg).toContain("4 days pending");
  });

  test("shows 'no phone' when phone is null", () => {
    const msg = formatStaleOrderAlert([mockOrder({ phone: null })]);
    expect(msg).toContain("no phone");
  });

  test("floors fractional days", () => {
    const msg = formatStaleOrderAlert([mockOrder({ days_since_created: 4.9 })]);
    expect(msg).toContain("4 days pending");
  });
});

describe("sendSlackAlert", () => {
  const originalEnv = process.env.SLACK_WEBHOOK_URL;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.SLACK_WEBHOOK_URL = originalEnv;
  });

  test("throws when SLACK_WEBHOOK_URL is not set", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    await expect(sendSlackAlert("test")).rejects.toThrow("SLACK_WEBHOOK_URL");
  });

  test("POSTs to the webhook URL with correct payload", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await sendSlackAlert("hello");

    expect(fetch).toHaveBeenCalledWith("https://hooks.slack.com/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "#order-alerts", text: "hello" }),
    });
  });

  test("throws when Slack returns a non-ok response", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    } as Response);

    await expect(sendSlackAlert("hello")).rejects.toThrow("400");
  });
});
