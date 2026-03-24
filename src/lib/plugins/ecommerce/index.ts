import type { VyrooPlugin } from "../types";

export const ecommercePlugin: VyrooPlugin = {
  id: "ecommerce",
  name: "E-Commerce Suite",
  description: "Shopify store management, order tracking, inventory optimization, and AI-powered product insights",
  version: "1.0.0",
  icon: "shopping-cart",
  vertical: "ecommerce",

  skills: [
    {
      id: "shopify-manager",
      name: "Shopify Manager",
      description: "Manage products, orders, and inventory through natural language",
      iconName: "shopping-bag",
      category: "vertical",
      tools: ["shopify_products", "shopify_orders", "shopify_inventory", "shopify_analytics"],
    },
    {
      id: "order-tracker",
      name: "Order Tracker",
      description: "Track and manage customer orders, fulfillments, and returns",
      iconName: "package",
      category: "vertical",
      tools: ["track_order", "update_fulfillment", "process_return"],
    },
    {
      id: "inventory-optimizer",
      name: "Inventory Optimizer",
      description: "AI-powered stock level optimization and reorder suggestions",
      iconName: "bar-chart-3",
      category: "analysis",
      tools: ["analyze_inventory", "predict_demand", "reorder_suggestions"],
    },
    {
      id: "storefront-builder",
      name: "Storefront Builder",
      description: "Generate and edit Shopify theme sections and product descriptions",
      iconName: "layout",
      category: "core",
      tools: ["generate_description", "edit_theme", "preview_storefront"],
    },
  ],

  connectors: [
    {
      id: "shopify",
      name: "Shopify",
      description: "Connect your Shopify store for product, order, and analytics access",
      iconName: "shopping-bag",
      authType: "oauth",
      category: "ecommerce",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and revenue analytics",
      iconName: "credit-card",
      authType: "api_key",
      category: "payments",
    },
    {
      id: "shipstation",
      name: "ShipStation",
      description: "Shipping label creation and tracking",
      iconName: "truck",
      authType: "api_key",
      category: "logistics",
    },
  ],

  tools: [
    {
      id: "shopify_products",
      name: "Shopify Products",
      description: "List, create, update, or delete products in Shopify",
      parameters: {
        action: { type: "string", description: "Action to perform", required: true, enum: ["list", "get", "create", "update", "delete"] },
        product_id: { type: "string", description: "Product ID (for get/update/delete)" },
        data: { type: "object", description: "Product data (for create/update)" },
      },
      handler: "ecommerce/shopify-products",
    },
    {
      id: "shopify_orders",
      name: "Shopify Orders",
      description: "List and manage Shopify orders",
      parameters: {
        action: { type: "string", description: "Action to perform", required: true, enum: ["list", "get", "fulfill", "cancel"] },
        order_id: { type: "string", description: "Order ID" },
        status: { type: "string", description: "Filter by status", enum: ["open", "closed", "cancelled", "any"] },
        limit: { type: "number", description: "Number of orders to return" },
      },
      handler: "ecommerce/shopify-orders",
    },
    {
      id: "shopify_analytics",
      name: "Shopify Analytics",
      description: "Get store analytics and performance metrics",
      parameters: {
        metric: { type: "string", description: "Metric to query", required: true, enum: ["revenue", "orders", "visitors", "conversion", "top_products", "daily_summary"] },
        period: { type: "string", description: "Time period", enum: ["today", "yesterday", "7d", "30d", "90d"] },
      },
      handler: "ecommerce/shopify-analytics",
    },
    {
      id: "analyze_inventory",
      name: "Analyze Inventory",
      description: "Analyze inventory levels and identify issues",
      parameters: {
        analysis_type: { type: "string", description: "Type of analysis", required: true, enum: ["low_stock", "overstock", "turnover", "reorder_point"] },
        threshold: { type: "number", description: "Custom threshold value" },
      },
      handler: "ecommerce/inventory-analysis",
    },
    {
      id: "generate_description",
      name: "Generate Product Description",
      description: "AI-generated product descriptions optimized for SEO",
      parameters: {
        product_title: { type: "string", description: "Product title", required: true },
        keywords: { type: "array", description: "SEO keywords to include" },
        tone: { type: "string", description: "Writing tone", enum: ["professional", "casual", "luxury", "playful"] },
        length: { type: "string", description: "Description length", enum: ["short", "medium", "long"] },
      },
      handler: "ecommerce/generate-description",
    },
  ],

  dashboardWidgets: [
    {
      id: "daily-brief",
      name: "Daily Store Brief",
      position: "main",
      component: "ecommerce/DailyBrief",
    },
    {
      id: "order-feed",
      name: "Live Order Feed",
      position: "sidebar",
      component: "ecommerce/OrderFeed",
    },
  ],

  onActivate: async () => {
    // activated
  },
  onDeactivate: async () => {
    // deactivated
  },
};
