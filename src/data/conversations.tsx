import { Search, Globe, FileText, Sparkles, Code, Palette, ShoppingCart, TrendingUp, Calendar, FlaskConical, HelpCircle } from "lucide-react";
import React from "react";

export interface LogEntry {
  time: string;
  text: string;
  type: "info" | "action" | "result";
}

export interface Step {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon: React.ReactNode;
  logs: LogEntry[];
}

export interface CodeLine {
  num: number;
  content: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasReport?: boolean;
  reportTitle?: string;
  reportSummary?: string;
  tableData?: { headers: string[]; rows: string[][] };
}

export interface SuggestedFollowUp {
  icon: React.ReactNode;
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
  icon: string;
  steps: Step[];
  messages: ChatMessage[];
  followUps: SuggestedFollowUp[];
  codeLines: CodeLine[];
  fileName: string;
  editorLabel: string;
}

export const conversations: Conversation[] = [
  {
    id: "1",
    title: "Top 5 DTC Skincare Brands and P...",
    icon: "📊",
    fileName: "dtc_skincare_analysis_final.md",
    editorLabel: "Editor",
    steps: [
      {
        id: 1, label: "Understanding task", detail: "Parsing requirements and planning the research approach", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "0:01", text: "Received task: Analyze top 5 DTC skincare brands", type: "info" },
          { time: "0:02", text: "Identifying key comparison metrics", type: "action" },
          { time: "0:03", text: "Planning research strategy across 5 brands", type: "result" },
        ],
      },
      {
        id: 2, label: "Researching brands", detail: "Browsing documentation and gathering market data", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:15", text: "Searching for The Ordinary market positioning", type: "action" },
          { time: "0:22", text: "Found pricing data for Glossier product lines", type: "result" },
          { time: "0:30", text: "Analyzing Rhode Skin viral growth metrics", type: "action" },
        ],
      },
      {
        id: 3, label: "Analyzing pricing strategies", detail: "Comparing pricing models and market positioning", status: "complete",
        icon: <Globe size={14} />,
        logs: [
          { time: "1:02", text: "Building comparative pricing table", type: "action" },
          { time: "1:15", text: "Categorizing by market tier: budget, mid, premium", type: "info" },
          { time: "1:28", text: "Pricing analysis complete for all 5 brands", type: "result" },
        ],
      },
      {
        id: 4, label: "Compile and deliver the final report", detail: "Creating final markdown report", status: "complete",
        icon: <FileText size={14} />,
        logs: [
          { time: "2:10", text: "Structuring report sections", type: "action" },
          { time: "2:25", text: "Writing executive summary", type: "action" },
          { time: "2:55", text: "Report compiled: dtc_skincare_analysis_final.md", type: "result" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Analyze the top 5 DTC skincare brands and their pricing strategies." },
      {
        id: "2", role: "assistant", content: "Here is the comparative analysis of the top 5 DTC skincare brands and their pricing strategies.", hasReport: true,
        reportTitle: "Comparative Analysis: Top 5 DTC Skincare Brands and Pricing Strategi...",
        reportSummary: "This report provides a comprehensive analysis of the top five Direct-to-Consumer (DTC) skincare brands currently leading the market.",
        tableData: {
          headers: ["Brand", "Market Positioning", "Core Philosophy"],
          rows: [
            ["The Ordinary", "Value/Budget Leader", "Clinical formulations with price integrity."],
            ["Glossier", "Mid-Tier Lifestyle", "\"Skin first, makeup second\" community-driven beauty."],
            ["Rhode Skin", "Viral/Celebrity-Led", "Curated essentials for a \"glazed\" look."],
            ["Dieux Skin", "Science/Transparency", "Radically transparent, clinically vetted formulas."],
          ],
        },
      },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "What are the market trends influencing DTC skincare pricing strategies?" },
      { icon: <Globe size={16} />, text: "Create a presentation about the top 5 DTC skincare brands." },
    ],
    codeLines: [
      { num: 1, content: "# Comparative Analysis: Top 5 DTC Skincare Brands", color: "text-red-400" },
      { num: 2, content: "(2025-2026)", color: "text-red-400" },
      { num: 3, content: "" },
      { num: 4, content: "This report provides a comprehensive analysis of the top five DTC", color: "text-foreground" },
      { num: 5, content: "skincare brands currently leading the market.", color: "text-foreground" },
      { num: 6, content: "" },
      { num: 7, content: "## 1. Overview of the Top 5 DTC Skincare Brands", color: "text-red-400" },
      { num: 8, content: "" },
      { num: 9, content: "| Brand | Market Positioning | Core Philosophy |", color: "text-foreground" },
      { num: 10, content: "| :---- | :---- | :---- |", color: "text-muted-foreground" },
      { num: 11, content: "| **The Ordinary** | Value/Budget Leader | Clinical formulations |", color: "text-foreground" },
      { num: 12, content: "| **Glossier** | Mid-Tier Lifestyle | Community-driven beauty |", color: "text-foreground" },
      { num: 13, content: "| **Rhode Skin** | Viral/Celebrity-Led | Curated essentials |", color: "text-foreground" },
      { num: 14, content: "| **Dieux Skin** | Science/Transparency | Clinically vetted |", color: "text-foreground" },
      { num: 15, content: "| **Drunk Elephant** | Premium/Luxury | Clean-clinical skincare |", color: "text-foreground" },
      { num: 16, content: "" },
      { num: 17, content: "## 2. Comparative Pricing Table", color: "text-red-400" },
      { num: 18, content: "" },
      { num: 19, content: "The table below compares pricing of key product categories.", color: "text-foreground" },
    ],
  },
  {
    id: "2",
    title: "Hottest 2026 DTC Products to Re...",
    icon: "🔥",
    fileName: "hot_dtc_products_2026.md",
    editorLabel: "Editor",
    steps: [
      {
        id: 1, label: "Scanning trending products", detail: "Monitoring social media and marketplace trends", status: "complete",
        icon: <TrendingUp size={14} />,
        logs: [
          { time: "0:05", text: "Scraping TikTok Shop trending products", type: "action" },
          { time: "0:18", text: "Found 23 viral products with 10M+ views", type: "result" },
        ],
      },
      {
        id: 2, label: "Filtering by profitability", detail: "Calculating margins and supplier costs", status: "complete",
        icon: <ShoppingCart size={14} />,
        logs: [
          { time: "0:40", text: "Cross-referencing with AliExpress suppliers", type: "action" },
          { time: "1:05", text: "Identified 8 products with 60%+ margins", type: "result" },
        ],
      },
      {
        id: 3, label: "Writing product summaries", detail: "Generating detailed product cards", status: "complete",
        icon: <FileText size={14} />,
        logs: [
          { time: "1:30", text: "Generating descriptions for top 8 picks", type: "action" },
          { time: "2:00", text: "Report ready: hot_dtc_products_2026.md", type: "result" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "What are the hottest DTC products to resell in 2026?" },
      { id: "2", role: "assistant", content: "I've compiled a list of the 8 hottest DTC products trending right now with high resale potential. Each product has been vetted for margin, demand velocity, and social proof.", hasReport: true,
        reportTitle: "Hottest DTC Products to Resell in 2026",
        reportSummary: "A curated selection of 8 trending products with verified 60%+ profit margins and viral social proof.",
        tableData: {
          headers: ["Product", "Category", "Avg Margin"],
          rows: [
            ["LED Face Mask Pro", "Beauty Tech", "72%"],
            ["Peptide Lip Oil", "Skincare", "68%"],
            ["Magnetic Lash Kit", "Beauty", "65%"],
            ["Ice Roller Duo", "Wellness", "74%"],
          ],
        },
      },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "How do I source these products from verified suppliers?" },
      { icon: <TrendingUp size={16} />, text: "Which marketing channels work best for these product types?" },
    ],
    codeLines: [
      { num: 1, content: "# Hottest DTC Products to Resell in 2026", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "## Selection Criteria", color: "text-red-400" },
      { num: 4, content: "- 10M+ social media views in last 30 days", color: "text-foreground" },
      { num: 5, content: "- 60%+ profit margin after COGS", color: "text-foreground" },
      { num: 6, content: "- Available from 3+ verified suppliers", color: "text-foreground" },
      { num: 7, content: "" },
      { num: 8, content: "## Top 8 Products", color: "text-red-400" },
      { num: 9, content: "" },
      { num: 10, content: "### 1. LED Face Mask Pro", color: "text-red-400" },
      { num: 11, content: "Category: Beauty Tech | Margin: 72%", color: "text-foreground" },
      { num: 12, content: "Trending on TikTok with 45M views.", color: "text-foreground" },
    ],
  },
  {
    id: "3",
    title: "Hello",
    icon: "👋",
    fileName: "chat_session.md",
    editorLabel: "Chat",
    steps: [
      {
        id: 1, label: "Processing greeting", detail: "Understanding user intent", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "0:01", text: "Greeting detected, no task assigned", type: "info" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "Hello! 👋 I'm Manus, your AI assistant. I can help you with research, writing, coding, data analysis, and much more. What would you like to work on today?" },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "Help me research a topic" },
      { icon: <Code size={16} />, text: "Build a website for me" },
    ],
    codeLines: [
      { num: 1, content: "# Welcome to Manus", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "No active task. Start by assigning a task.", color: "text-muted-foreground" },
    ],
  },
  {
    id: "4",
    title: "Designing a Website for Vyroo.ai I...",
    icon: "🎨",
    fileName: "vyroo_website/index.html",
    editorLabel: "Code Editor",
    steps: [
      {
        id: 1, label: "Analyzing brand requirements", detail: "Understanding Vyroo.ai brand identity", status: "complete",
        icon: <Palette size={14} />,
        logs: [
          { time: "0:05", text: "Researching Vyroo.ai brand guidelines", type: "action" },
          { time: "0:20", text: "Identified color palette: #0A0F1E, #6C5CE7", type: "result" },
        ],
      },
      {
        id: 2, label: "Building page structure", detail: "Creating HTML/CSS layout", status: "complete",
        icon: <Code size={14} />,
        logs: [
          { time: "0:45", text: "Writing responsive hero section", type: "action" },
          { time: "1:10", text: "Added feature grid and pricing cards", type: "action" },
          { time: "1:30", text: "Page structure complete with 5 sections", type: "result" },
        ],
      },
      {
        id: 3, label: "Polishing design details", detail: "Adding animations and micro-interactions", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "2:00", text: "Adding scroll-reveal animations", type: "action" },
          { time: "2:20", text: "Website deployed to preview", type: "result" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Design a modern landing page for Vyroo.ai, an AI-powered analytics platform." },
      { id: "2", role: "assistant", content: "I've designed and built a complete landing page for Vyroo.ai with a dark, modern aesthetic featuring scroll animations, a responsive layout, and conversion-optimized sections." },
    ],
    followUps: [
      { icon: <Code size={16} />, text: "Add a pricing comparison table to the website" },
      { icon: <Palette size={16} />, text: "Create a matching dashboard UI" },
    ],
    codeLines: [
      { num: 1, content: "<!DOCTYPE html>", color: "text-muted-foreground" },
      { num: 2, content: '<html lang="en">', color: "text-foreground" },
      { num: 3, content: "<head>", color: "text-foreground" },
      { num: 4, content: '  <meta charset="UTF-8" />', color: "text-foreground" },
      { num: 5, content: '  <meta name="viewport" content="width=device-width" />', color: "text-foreground" },
      { num: 6, content: "  <title>Vyroo.ai — AI Analytics</title>", color: "text-red-400" },
      { num: 7, content: '  <link rel="stylesheet" href="styles.css" />', color: "text-foreground" },
      { num: 8, content: "</head>", color: "text-foreground" },
      { num: 9, content: "<body>", color: "text-foreground" },
      { num: 10, content: '  <header class="hero">', color: "text-foreground" },
      { num: 11, content: "    <h1>Unlock AI-Powered Insights</h1>", color: "text-red-400" },
      { num: 12, content: "    <p>Transform your data into decisions.</p>", color: "text-foreground" },
      { num: 13, content: "  </header>", color: "text-foreground" },
    ],
  },
  {
    id: "5",
    title: "Using Meta Ads to Attract More C...",
    icon: "📱",
    fileName: "meta_ads_strategy.md",
    editorLabel: "Editor",
    steps: [
      {
        id: 1, label: "Researching Meta Ads best practices", detail: "Analyzing current ad strategies", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:10", text: "Reviewing Meta Ads documentation", type: "action" },
          { time: "0:30", text: "Compiled 12 high-performing ad formats", type: "result" },
        ],
      },
      {
        id: 2, label: "Building campaign framework", detail: "Creating audience targeting strategy", status: "complete",
        icon: <Globe size={14} />,
        logs: [
          { time: "1:00", text: "Defining lookalike audiences", type: "action" },
          { time: "1:20", text: "Campaign structure ready", type: "result" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "How can I use Meta Ads to attract more customers to my online store?" },
      { id: "2", role: "assistant", content: "I've created a comprehensive Meta Ads strategy tailored for e-commerce, including campaign structure, audience targeting, and budget allocation recommendations." },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "What budget should I start with for Meta Ads?" },
    ],
    codeLines: [
      { num: 1, content: "# Meta Ads Strategy for E-Commerce", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "## Campaign Structure", color: "text-red-400" },
      { num: 4, content: "1. **Awareness** — Video ads targeting broad interests", color: "text-foreground" },
      { num: 5, content: "2. **Consideration** — Carousel ads with product catalog", color: "text-foreground" },
      { num: 6, content: "3. **Conversion** — Dynamic retargeting with discounts", color: "text-foreground" },
    ],
  },
];

export function getConversation(id: string): Conversation {
  return conversations.find((c) => c.id === id) || conversations[0];
}
