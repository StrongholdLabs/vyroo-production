/**
 * System prompt additions for the e-commerce plugin.
 * Injected into the AI system prompt when the plugin is active.
 */

export const ECOM_SYSTEM_PROMPT = `
You are also an e-commerce assistant with expertise in Shopify store management.

When the user asks about their store, products, orders, or analytics:
1. Use the appropriate Shopify tools to fetch real data
2. Present results in a clear, actionable format
3. Proactively suggest optimizations when you notice issues

Key capabilities:
- Product management (CRUD, bulk operations, variant handling)
- Order tracking and fulfillment management
- Inventory monitoring with low-stock alerts
- Revenue and conversion analytics
- SEO-optimized product description generation
- Competitive pricing suggestions

When presenting store data:
- Use tables for product/order lists
- Include trend indicators for metrics
- Highlight urgent items (low stock, pending orders)
- Always show currency with $ symbol
- Round percentages to 1 decimal place

For analytics requests, default to "last 7 days" if no period specified.
For product searches, be case-insensitive and match partial titles.
`;

/**
 * Generates a daily brief prompt for the store overview widget.
 */
export function getDailyBriefPrompt(storeName: string): string {
  return `Generate a brief daily summary for the Shopify store "${storeName}". Include:
1. Yesterday's key metrics (orders, revenue, visitors)
2. Any urgent alerts (low stock items, pending fulfillments, high-value orders)
3. Top performing products
4. One actionable suggestion for today

Keep it concise — max 200 words. Use bullet points.`;
}

/**
 * Returns follow-up suggestions relevant to e-commerce context.
 */
export function getEcomFollowUps(signalType: string): Array<{ text: string; category: string }> {
  const followUps: Record<string, Array<{ text: string; category: string }>> = {
    product_query: [
      { text: "Show me top selling products this month", category: "analysis" },
      { text: "Which products need updated descriptions?", category: "document" },
      { text: "Find products with low inventory", category: "research" },
    ],
    order_lookup: [
      { text: "Show all unfulfilled orders", category: "research" },
      { text: "What's the average order value this week?", category: "analysis" },
      { text: "List orders pending shipment", category: "research" },
    ],
    analytics_request: [
      { text: "Compare this week to last week", category: "analysis" },
      { text: "What's our conversion rate trend?", category: "analysis" },
      { text: "Show revenue breakdown by product", category: "analysis" },
    ],
    inventory_check: [
      { text: "Generate restock recommendations", category: "analysis" },
      { text: "Which items are overstocked?", category: "research" },
      { text: "Show inventory turnover rates", category: "analysis" },
    ],
  };

  return followUps[signalType] ?? [
    { text: "Show me today's store summary", category: "analysis" },
    { text: "List recent orders", category: "research" },
    { text: "Check inventory levels", category: "research" },
  ];
}
