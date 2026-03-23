/**
 * Detects e-commerce intent signals in user messages.
 * Used to auto-suggest relevant tools and route to appropriate handlers.
 * Ported from Vyroo Command Center's signal detection system.
 */

export interface EcomSignal {
  type: EcomSignalType;
  confidence: number; // 0-1
  entities: Record<string, string>;
}

export type EcomSignalType =
  | "product_query"
  | "order_lookup"
  | "inventory_check"
  | "analytics_request"
  | "description_generation"
  | "price_change"
  | "fulfillment_action"
  | "store_config";

interface SignalPattern {
  type: EcomSignalType;
  patterns: RegExp[];
  entityExtractors?: Record<string, RegExp>;
}

const signalPatterns: SignalPattern[] = [
  {
    type: "product_query",
    patterns: [
      /\b(product|item|sku|listing|merchandise)\b/i,
      /\b(show|find|search|list|get)\b.*\b(product|item)/i,
      /\bhow many (product|item)/i,
    ],
    entityExtractors: {
      product_name: /(?:product|item)\s+(?:called|named|titled)\s+"?([^"]+)"?/i,
      sku: /\bsku\s*[:#]?\s*(\w+)/i,
    },
  },
  {
    type: "order_lookup",
    patterns: [
      /\b(order|purchase|transaction)\s*#?\s*\d*/i,
      /\b(check|track|find|status)\b.*\border\b/i,
      /\brecent\s+orders\b/i,
      /\border\s+history\b/i,
    ],
    entityExtractors: {
      order_id: /order\s*#?\s*(\d+)/i,
      customer: /(?:from|by|for)\s+(\w+[\s\w]*)/i,
    },
  },
  {
    type: "inventory_check",
    patterns: [
      /\b(inventory|stock|in stock|out of stock|quantity)\b/i,
      /\bhow many.*(?:left|remaining|available)\b/i,
      /\b(restock|reorder|low stock)\b/i,
    ],
  },
  {
    type: "analytics_request",
    patterns: [
      /\b(revenue|sales|analytics|metrics|performance)\b/i,
      /\bhow (?:much|many).*(?:sold|revenue|earned)\b/i,
      /\b(daily|weekly|monthly)\s+(?:report|summary|brief)\b/i,
      /\btop\s+(?:selling|performing|products)\b/i,
      /\bconversion\s+rate\b/i,
    ],
    entityExtractors: {
      period: /(today|yesterday|this week|this month|last \d+ days)/i,
      metric: /(revenue|orders|visitors|conversion|aov)/i,
    },
  },
  {
    type: "description_generation",
    patterns: [
      /\b(write|generate|create|draft)\b.*\b(description|copy|listing)\b/i,
      /\bproduct\s+description\b/i,
      /\bSEO\s+(?:description|copy|content)\b/i,
    ],
  },
  {
    type: "price_change",
    patterns: [
      /\b(price|pricing|cost|markup|discount)\b/i,
      /\b(change|update|set|adjust)\b.*\bprice\b/i,
      /\bput.*on sale\b/i,
    ],
    entityExtractors: {
      amount: /\$(\d+(?:\.\d{2})?)/,
      percentage: /(\d+)%/,
    },
  },
  {
    type: "fulfillment_action",
    patterns: [
      /\b(fulfill|ship|shipping|tracking|delivery)\b/i,
      /\b(mark|set)\b.*\b(shipped|fulfilled|delivered)\b/i,
      /\btracking\s+number\b/i,
    ],
  },
  {
    type: "store_config",
    patterns: [
      /\b(store|shop|storefront)\s+(?:settings|config|setup)\b/i,
      /\b(theme|layout|design)\b.*\bstore\b/i,
    ],
  },
];

/**
 * Detects e-commerce signals in a user message.
 * Returns all matching signals sorted by confidence.
 */
export function detectEcomSignals(message: string): EcomSignal[] {
  const signals: EcomSignal[] = [];

  for (const pattern of signalPatterns) {
    let matchCount = 0;
    for (const regex of pattern.patterns) {
      if (regex.test(message)) matchCount++;
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / pattern.patterns.length + 0.3, 1);
      const entities: Record<string, string> = {};

      if (pattern.entityExtractors) {
        for (const [key, regex] of Object.entries(pattern.entityExtractors)) {
          const match = message.match(regex);
          if (match?.[1]) {
            entities[key] = match[1];
          }
        }
      }

      signals.push({ type: pattern.type, confidence, entities });
    }
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Maps a signal type to the recommended tool to invoke.
 */
export function signalToTool(signal: EcomSignalType): string {
  const mapping: Record<EcomSignalType, string> = {
    product_query: "shopify_products",
    order_lookup: "shopify_orders",
    inventory_check: "analyze_inventory",
    analytics_request: "shopify_analytics",
    description_generation: "generate_description",
    price_change: "shopify_products",
    fulfillment_action: "shopify_orders",
    store_config: "shopify_products",
  };
  return mapping[signal];
}
