import { Search, Globe, FileText, Sparkles, Code, Palette, ShoppingCart, TrendingUp, Calendar, FlaskConical, HelpCircle } from "lucide-react";
import React from "react";
import type { BrowserTab, BrowserPageContent } from "@/components/computer/BrowserView";
import type { SearchResult } from "@/components/computer/SearchView";
import type { ResearchTask } from "@/components/computer/TaskProgressPanel";
import type { TimelineEntry } from "@/components/computer/ResearchTimeline";
export type { ResearchTask } from "@/components/computer/TaskProgressPanel";
export type { TimelineEntry } from "@/components/computer/ResearchTimeline";

export interface LogEntry {
  time: string;
  text: string;
  type: "info" | "action" | "result";
}

export interface SubTask {
  text: string;
  type?: "edit" | "image" | "terminal";
  imageUrl?: string;
}

export interface Step {
  id: number;
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
  icon: React.ReactNode;
  logs: LogEntry[];
  subTasks?: SubTask[];
}

export interface CodeLine {
  num: number;
  content: string;
  color?: string;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  expanded?: boolean;
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

export interface ProjectInfo {
  name: string;
  description: string;
  status: "initialized" | "building" | "complete";
}

export type ComputerViewType = "editor" | "browser" | "search" | "document";

export interface DocumentData {
  title: string;
  content: string;
  format: string;
  wordCount: number;
}

export interface ComputerViewState {
  type: ComputerViewType;
  browserTabs?: BrowserTab[];
  browserUrl?: string;
  browserContent?: BrowserPageContent;
  searchQuery?: string;
  searchResults?: SearchResult[];
  timeline?: TimelineEntry[];
  document?: DocumentData;
}

export interface Conversation {
  id: string;
  title: string;
  icon: string;
  type: "intelligence" | "website" | "research";
  steps: Step[];
  messages: ChatMessage[];
  followUps: SuggestedFollowUp[];
  codeLines: CodeLine[];
  fileName: string;
  editorLabel: string;
  fileTree?: FileNode[];
  isComplete?: boolean;
  project?: ProjectInfo;
  computerView?: ComputerViewState;
  researchTasks?: ResearchTask[];
}

export const conversations: Conversation[] = [
  {
    id: "1",
    title: "Top 5 DTC Skincare Brands and P...",
    icon: "📊",
    type: "intelligence",
    fileName: "dtc_skincare_analysis_final.md",
    editorLabel: "Editor",
    isComplete: true,
    fileTree: [
      { name: "research", type: "folder", expanded: true, children: [
        { name: "brand_data.json", type: "file" },
        { name: "pricing_matrix.csv", type: "file" },
      ]},
      { name: "dtc_skincare_analysis_final.md", type: "file" },
      { name: "references.md", type: "file" },
    ],
    steps: [
      {
        id: 1, label: "Understanding task", detail: "Parsing requirements and planning the research approach", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "0:01", text: "Received task: Analyze top 5 DTC skincare brands", type: "info" },
          { time: "0:02", text: "Identifying key comparison metrics", type: "action" },
          { time: "0:03", text: "Planning research strategy across 5 brands", type: "result" },
        ],
        subTasks: [
          { text: "Create design brainstorm document with three distinct landing ...", type: "edit" },
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
        subTasks: [
          { text: "Update index.css with modern minimalist color theme and typo...", type: "edit" },
          { text: "Generate three high-quality hero and accent images for the mo...", type: "image" },
          { text: "Generate three high-quality hero and accent images for the mo...", type: "image" },
          { text: "Generate three high-quality hero and accent images for the mo...", type: "image" },
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
    type: "intelligence",
    fileName: "hot_dtc_products_2026.md",
    editorLabel: "Editor",
    isComplete: true,
    fileTree: [
      { name: "data", type: "folder", expanded: true, children: [
        { name: "tiktok_trends.json", type: "file" },
        { name: "supplier_list.csv", type: "file" },
      ]},
      { name: "hot_dtc_products_2026.md", type: "file" },
    ],
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
    type: "intelligence",
    fileName: "chat_session.md",
    editorLabel: "Chat",
    fileTree: [
      { name: "chat_session.md", type: "file" },
    ],
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
      { id: "2", role: "assistant", content: "Hello! 👋 I'm Vyroo, your AI assistant. I can help you with research, writing, coding, data analysis, and much more. What would you like to work on today?" },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "Help me research a topic" },
      { icon: <Code size={16} />, text: "Build a website for me" },
    ],
    codeLines: [
      { num: 1, content: "# Welcome to Vyroo", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "No active task. Start by assigning a task.", color: "text-muted-foreground" },
    ],
  },
  {
    id: "4",
    title: "Designing a Website for Vyroo.ai I...",
    icon: "🎨",
    type: "website",
    project: {
      name: "Vyroo.ai - AI Revenue Operator",
      description: "Landing page for Vyroo.ai",
      status: "complete",
    },
    fileName: "vyroo_website/index.html",
    editorLabel: "Code Editor",
    isComplete: true,
    fileTree: [
      { name: "src", type: "folder", expanded: true, children: [
        { name: "components", type: "folder", children: [
          { name: "Header.tsx", type: "file" },
          { name: "Hero.tsx", type: "file" },
          { name: "Features.tsx", type: "file" },
          { name: "Pricing.tsx", type: "file" },
        ]},
        { name: "App.tsx", type: "file" },
        { name: "index.css", type: "file" },
      ]},
      { name: "public", type: "folder", children: [
        { name: "favicon.svg", type: "file" },
      ]},
      { name: "index.html", type: "file" },
      { name: "package.json", type: "file" },
      { name: "vite.config.ts", type: "file" },
    ],
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
    type: "intelligence",
    fileName: "meta_ads_strategy.md",
    editorLabel: "Editor",
    fileTree: [
      { name: "meta_ads_strategy.md", type: "file" },
      { name: "audience_segments.json", type: "file" },
    ],
    steps: [
      {
        id: 1, label: "Researching Meta Ads best practices", detail: "Analyzing current ad strategies and platform documentation", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:10", text: "Reviewing Meta Ads documentation", type: "action" },
          { time: "0:30", text: "Compiled 12 high-performing ad formats", type: "result" },
        ],
      },
      {
        id: 2, label: "Building campaign framework", detail: "Creating audience targeting strategy and budget allocation", status: "active",
        icon: <Globe size={14} />,
        logs: [
          { time: "1:00", text: "Defining lookalike audiences", type: "action" },
          { time: "1:12", text: "Calculating optimal budget splits...", type: "info" },
        ],
      },
      {
        id: 3, label: "Creating ad copy variations", detail: "Generating A/B test copy and creative briefs", status: "pending",
        icon: <FileText size={14} />,
        logs: [],
      },
      {
        id: 4, label: "Deliver final strategy document", detail: "Compiling all recommendations into actionable plan", status: "pending",
        icon: <Sparkles size={14} />,
        logs: [],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "How can I use Meta Ads to attract more customers to my online store?" },
      { id: "2", role: "assistant", content: "I'm building a comprehensive Meta Ads strategy for your e-commerce store. I've finished researching best practices and I'm now working on the campaign framework with audience targeting and budget allocation." },
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
  {
    id: "6",
    title: "Waar komen katten vandaan?",
    icon: "🐱",
    type: "intelligence",
    fileName: "katten_onderzoek.md",
    editorLabel: "Editor",
    fileTree: [
      { name: "katten_onderzoek.md", type: "file" },
      { name: "bronnen.md", type: "file" },
    ],
    steps: [
      {
        id: 1, label: "Interpreting query language", detail: "Detected Dutch language, preparing bilingual response", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "0:01", text: "Language detected: Dutch (nl)", type: "info" },
          { time: "0:03", text: "Preparing response in Dutch", type: "action" },
        ],
      },
      {
        id: 2, label: "Researching feline domestication", detail: "Gathering historical and scientific sources about cat origins", status: "active",
        icon: <Search size={14} />,
        logs: [
          { time: "0:15", text: "Searching archaeological records of cat domestication", type: "action" },
          { time: "0:28", text: "Found key study: Near Eastern wildcat (Felis silvestris lybica)", type: "result" },
          { time: "0:35", text: "Cross-referencing with genetic lineage data...", type: "info" },
        ],
      },
      {
        id: 3, label: "Compiling historical timeline", detail: "Building a timeline from ancient Egypt to modern breeds", status: "pending",
        icon: <Calendar size={14} />,
        logs: [],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Waar komen katten vandaan?" },
      { id: "2", role: "assistant", content: "Ik ben aan het onderzoeken waar katten oorspronkelijk vandaan komen. Ik heb al gevonden dat de huiskat afstamt van de Nabij-Oosterse wilde kat (Felis silvestris lybica) en ben nu de historische tijdlijn aan het samenstellen." },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "Welke kattenrassen zijn het oudst?" },
      { icon: <Globe size={16} />, text: "Hoe zijn katten in Europa terechtgekomen?" },
    ],
    codeLines: [
      { num: 1, content: "# Oorsprong van de Huiskat", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "## Domesticatie", color: "text-red-400" },
      { num: 4, content: "De huiskat (Felis catus) stamt af van de wilde kat", color: "text-foreground" },
      { num: 5, content: "Felis silvestris lybica uit het Nabije Oosten.", color: "text-foreground" },
      { num: 6, content: "" },
      { num: 7, content: "Eerste bewijs van domesticatie: ~9.500 jaar geleden", color: "text-foreground" },
      { num: 8, content: "Locatie: Cyprus (archeologische vondst)", color: "text-foreground" },
    ],
  },
  {
    id: "7",
    title: "Minimalist Online Store for Specia...",
    icon: "🛒",
    type: "website",
    project: {
      name: "Specialty Coffee Store",
      description: "Minimalist e-commerce store",
      status: "building",
    },
    fileName: "store_design/App.tsx",
    editorLabel: "Code Editor",
    fileTree: [
      { name: "src", type: "folder", expanded: true, children: [
        { name: "context", type: "folder", children: [
          { name: "CartContext.tsx", type: "file" },
        ]},
        { name: "components", type: "folder", children: [
          { name: "ProductGrid.tsx", type: "file" },
          { name: "CartDrawer.tsx", type: "file" },
          { name: "Header.tsx", type: "file" },
        ]},
        { name: "App.tsx", type: "file" },
      ]},
      { name: "package.json", type: "file" },
    ],
    steps: [
      {
        id: 1, label: "Gathering store requirements", detail: "Understanding product catalog and brand identity", status: "complete",
        icon: <ShoppingCart size={14} />,
        logs: [
          { time: "0:05", text: "Analyzing specialty coffee market aesthetic", type: "action" },
          { time: "0:15", text: "Defined minimalist design system", type: "result" },
        ],
      },
      {
        id: 2, label: "Building product catalog", detail: "Creating product cards and category pages", status: "complete",
        icon: <Code size={14} />,
        logs: [
          { time: "0:40", text: "Generating product grid component", type: "action" },
          { time: "1:00", text: "Added cart functionality", type: "result" },
        ],
      },
      {
        id: 3, label: "Implementing checkout flow", detail: "Building cart review and payment integration", status: "active",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "1:20", text: "Building cart drawer with quantity controls", type: "action" },
          { time: "1:35", text: "Working on checkout form validation...", type: "info" },
        ],
      },
      {
        id: 4, label: "Adding responsive design", detail: "Optimizing layouts for mobile and tablet", status: "pending",
        icon: <Palette size={14} />,
        logs: [],
      },
      {
        id: 5, label: "Final review and polish", detail: "Testing all flows and adding micro-interactions", status: "pending",
        icon: <FlaskConical size={14} />,
        logs: [],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Build a minimalist online store for specialty coffee beans with a clean, modern design." },
      { id: "2", role: "assistant", content: "I'm building your specialty coffee store. The product catalog is ready and I'm currently implementing the checkout flow with cart management. After that, I'll add responsive design and polish the micro-interactions." },
    ],
    followUps: [
      { icon: <Code size={16} />, text: "Add a subscription option for recurring coffee deliveries" },
      { icon: <Palette size={16} />, text: "Change the color scheme to earthy tones" },
    ],
    codeLines: [
      { num: 1, content: "import React from 'react';", color: "text-foreground" },
      { num: 2, content: "import { CartProvider } from './context/CartContext';", color: "text-foreground" },
      { num: 3, content: "" },
      { num: 4, content: "function App() {", color: "text-foreground" },
      { num: 5, content: "  return (", color: "text-foreground" },
      { num: 6, content: "    <CartProvider>", color: "text-red-400" },
      { num: 7, content: "      <div className=\"min-h-screen bg-stone-50\">", color: "text-foreground" },
      { num: 8, content: "        <Header />", color: "text-red-400" },
      { num: 9, content: "        <ProductGrid />", color: "text-red-400" },
      { num: 10, content: "        <CartDrawer />", color: "text-red-400" },
      { num: 11, content: "      </div>", color: "text-foreground" },
      { num: 12, content: "    </CartProvider>", color: "text-red-400" },
      { num: 13, content: "  );", color: "text-foreground" },
      { num: 14, content: "}", color: "text-foreground" },
    ],
  },
  {
    id: "8",
    title: "Designing a Website for Vyroo.ai I...",
    icon: "🌐",
    type: "website",
    fileName: "client/src/index.css",
    editorLabel: "Code Editor",
    isComplete: false,
    project: {
      name: "Vyroo.ai - AI Revenue Operator",
      description: "Landing page inspired by Perplexity's design",
      status: "building",
    },
    fileTree: [
      { name: "client", type: "folder", expanded: true, children: [
        { name: "src", type: "folder", expanded: true, children: [
          { name: "components", type: "folder", children: [
            { name: "Sidebar.tsx", type: "file" },
            { name: "AskInput.tsx", type: "file" },
            { name: "ThreadCard.tsx", type: "file" },
          ]},
          { name: "contexts", type: "folder", children: [] },
          { name: "hooks", type: "folder", children: [] },
          { name: "lib", type: "folder", children: [] },
          { name: "pages", type: "folder", expanded: true, children: [
            { name: "Home.tsx", type: "file" },
            { name: "Discover.tsx", type: "file" },
            { name: "Library.tsx", type: "file" },
          ]},
          { name: "App.tsx", type: "file" },
          { name: "index.css", type: "file" },
          { name: "main.tsx", type: "file" },
        ]},
        { name: "index.html", type: "file" },
        { name: "components.json", type: "file" },
        { name: "package.json", type: "file" },
        { name: "vite.config.ts", type: "file" },
      ]},
      { name: "server", type: "folder", children: [] },
      { name: "shared", type: "folder", children: [] },
    ],
    steps: [
      {
        id: 1, label: "Research Perplexity's website design and vyroo.ai brand", detail: "Analyzing both websites for design inspiration", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:05", text: "Searching for vyroo.ai to understand its business", type: "action" },
          { time: "0:12", text: "Found: AI-powered content tools with modern aesthetic", type: "result" },
          { time: "0:20", text: "Visiting perplexity.ai to analyze design and layout", type: "action" },
          { time: "0:35", text: "Checking vyroo.ai exists and analyzing current design", type: "action" },
        ],
        subTasks: [
          { text: "Search for vyroo.ai to understand its business and current website.", type: "terminal" },
          { text: "Visit perplexity.ai to analyze its design and layout.", type: "terminal" },
          { text: "Check if vyroo.ai exists and what it looks like.", type: "terminal" },
        ],
      },
      {
        id: 2, label: "Save research findings for Perplexity and Vyroo", detail: "Documenting design patterns and brand elements", status: "complete",
        icon: <FileText size={14} />,
        logs: [
          { time: "0:50", text: "Saving research findings for Perplexity and Vyroo", type: "action" },
          { time: "1:05", text: "Design patterns documented", type: "result" },
        ],
        subTasks: [
          { text: "Save research findings for Perplexity and Vyroo.", type: "edit" },
        ],
      },
      {
        id: 3, label: "Create a detailed design proposal and wireframe concepts", detail: "Building comprehensive design document", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "1:15", text: "Creating comprehensive design proposal document", type: "action" },
          { time: "1:40", text: "Design concept: Conversational Intelligence for Commerce", type: "result" },
        ],
        subTasks: [
          { text: "Create a comprehensive design proposal document for vyroo.ai inspired by Perplexity.", type: "edit" },
        ],
      },
      {
        id: 4, label: "Gather visual assets and define design system", detail: "Generating hero images and defining color palette", status: "active",
        icon: <Palette size={14} />,
        logs: [
          { time: "2:00", text: "Generating high-quality hero images for the vyroo.ai website", type: "action" },
          { time: "2:15", text: "Generating hero image variant 2...", type: "action" },
          { time: "2:25", text: "Generating hero image variant 3...", type: "action" },
        ],
        subTasks: [
          { text: "Generate high-quality hero images for the vyroo.ai website with modern AI/tech aesthetic.", type: "image", imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=200&fit=crop" },
          { text: "Generate high-quality hero images for the vyroo.ai website with modern AI/tech aesthetic.", type: "image", imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop" },
          { text: "Generate high-quality hero images for the vyroo.ai website with modern AI/tech aesthetic.", type: "image", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop" },
        ],
      },
      {
        id: 5, label: "Build the vyroo.ai website prototype", detail: "Developing the full website with components and routing", status: "pending",
        icon: <Code size={14} />,
        logs: [],
        subTasks: [
          { text: "Update index.css with the Vyroo color palette and typography system.", type: "edit" },
          { text: "Update index.html with Google Fonts import.", type: "edit" },
          { text: "Create the Sidebar component for navigation.", type: "edit" },
          { text: "Create the AskInput component for the main search/query interface.", type: "edit" },
          { text: "Create the ThreadCard component for displaying responses.", type: "edit" },
          { text: "Create the Home page with the main interface.", type: "edit" },
          { text: "Create the Library page.", type: "edit" },
          { text: "Create the Skills page.", type: "edit" },
          { text: "Create the Automations page.", type: "edit" },
          { text: "Update App.tsx to include all new routes.", type: "edit" },
          { text: "Verify the project structure and check for any build issues.", type: "terminal" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Brainstorm a new website for vyroo.ai inspired by Perplexity's design." },
      { id: "2", role: "assistant", content: "I've received your request to brainstorm a new website for vyroo.ai inspired by Perplexity's design. I'll start by researching both vyroo.ai and Perplexity to create a detailed proposal for you." },
      { id: "3", role: "assistant", content: "I learned vyroo.ai focuses on AI-powered content tools and has a modern, clean aesthetic. I'll analyze perplexity.ai's design next for inspiration." },
      { id: "4", role: "assistant", content: "I've checked both sites. Vyroo.ai emphasizes AI-driven store management, automation, and actionable insights. Perplexity.ai has a clean, information-focused AI search interface. Next, I'll analyze their design styles for inspiration." },
    ],
    followUps: [
      { icon: <Code size={16} />, text: "Proceed with building the website prototype" },
      { icon: <Palette size={16} />, text: "Refine any aspects of the design proposal first" },
    ],
    codeLines: [
      { num: 1, content: "@import \"tailwindcss\";", color: "text-foreground" },
      { num: 2, content: "@import \"tw-animate-css\";", color: "text-foreground" },
      { num: 3, content: "" },
      { num: 4, content: "@custom-variant dark (&:is(.dark *));", color: "text-muted-foreground" },
      { num: 5, content: "" },
      { num: 6, content: "@theme inline {", color: "text-foreground" },
      { num: 7, content: "  --radius-sm: calc(var(--radius) - 4px);", color: "text-foreground" },
      { num: 8, content: "  --radius-md: calc(var(--radius) - 2px);", color: "text-foreground" },
      { num: 9, content: "  --radius-lg: var(--radius);", color: "text-foreground" },
      { num: 10, content: "  --radius-xl: calc(var(--radius) + 4px);", color: "text-foreground" },
      { num: 11, content: "  --color-background: var(--background);", color: "text-foreground" },
      { num: 12, content: "  --color-foreground: var(--foreground);", color: "text-foreground" },
      { num: 13, content: "  --color-card: var(--card);", color: "text-foreground" },
      { num: 14, content: "  --color-card-foreground: var(--card-foreground);", color: "text-foreground" },
      { num: 15, content: "  --color-primary: var(--primary);", color: "text-foreground" },
      { num: 16, content: "  --color-primary-foreground: var(--primary-foreground);", color: "text-foreground" },
      { num: 17, content: "  --color-secondary: var(--secondary);", color: "text-foreground" },
      { num: 18, content: "  --color-muted: var(--muted);", color: "text-foreground" },
      { num: 19, content: "  --color-accent: var(--accent);", color: "text-foreground" },
      { num: 20, content: "  --color-destructive: var(--destructive);", color: "text-foreground" },
    ],
  },
  {
    id: "9",
    title: "Build a Landing Page",
    icon: "🚀",
    type: "website",
    fileName: "landing/src/App.tsx",
    editorLabel: "Code Editor",
    isComplete: false,
    project: {
      name: "My Store Landing Page",
      description: "High-converting landing page for your Shopify store",
      status: "building",
    },
    fileTree: [
      { name: "src", type: "folder", expanded: true, children: [
        { name: "components", type: "folder", children: [
          { name: "Hero.tsx", type: "file" },
          { name: "Features.tsx", type: "file" },
          { name: "CTA.tsx", type: "file" },
        ]},
        { name: "App.tsx", type: "file" },
        { name: "index.css", type: "file" },
      ]},
      { name: "package.json", type: "file" },
    ],
    steps: [
      {
        id: 1, label: "Analyze store and define landing page strategy", detail: "Connecting to your Shopify store, analyzing product catalog, and determining the best landing page structure", status: "complete",
        icon: <ShoppingCart size={14} />,
        logs: [
          { time: "0:05", text: "Connecting to Shopify store via API", type: "action" },
          { time: "0:18", text: "Found 47 products across 6 collections", type: "result" },
          { time: "0:25", text: "Identified best-sellers: 3 hero products for landing page", type: "result" },
          { time: "0:32", text: "Strategy defined: hero + benefits + social proof + CTA", type: "result" },
        ],
        subTasks: [
          { text: "Connect to Shopify store and pull product data.", type: "terminal" },
          { text: "Analyze top-performing products and categories.", type: "edit" },
        ],
      },
      {
        id: 2, label: "Generate visuals and build landing page", detail: "Creating hero images, product shots, and building the responsive landing page", status: "active",
        icon: <Palette size={14} />,
        logs: [
          { time: "0:50", text: "Generating hero banner with product lifestyle imagery", type: "action" },
          { time: "1:10", text: "Building responsive hero section with CTA", type: "action" },
          { time: "1:25", text: "Adding product feature grid...", type: "info" },
        ],
        subTasks: [
          { text: "Generate hero banner image with modern e-commerce aesthetic.", type: "image", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop" },
          { text: "Generate product lifestyle photography for feature section.", type: "image", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop" },
          { text: "Generate social proof section background.", type: "image", imageUrl: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=300&h=200&fit=crop" },
          { text: "Build Hero component with animated headline and CTA.", type: "edit" },
          { text: "Build Features grid with product highlights.", type: "edit" },
        ],
      },
      {
        id: 3, label: "Connect store checkout and deploy", detail: "Integrating Shopify checkout, adding analytics, and deploying the landing page", status: "pending",
        icon: <Globe size={14} />,
        logs: [],
        subTasks: [
          { text: "Integrate Shopify Buy Button for direct checkout.", type: "edit" },
          { text: "Add conversion tracking and analytics.", type: "edit" },
          { text: "Deploy and verify live landing page.", type: "terminal" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Build a high-converting landing page for my Shopify store. I want it to showcase my best products with a modern design." },
      { id: "2", role: "assistant", content: "I've connected to your Shopify store and analyzed your product catalog. You have 47 products across 6 collections — I've identified your 3 top-performing products to feature as heroes on the landing page." },
      { id: "3", role: "assistant", content: "Now I'm generating custom visuals and building the landing page with a hero section, product features, social proof, and a strong call-to-action. The design will match your store's brand identity." },
    ],
    followUps: [
      { icon: <ShoppingCart size={16} />, text: "Add a discount code banner to the landing page" },
      { icon: <Palette size={16} />, text: "Change the color scheme to match my brand" },
      { icon: <Code size={16} />, text: "Add an email capture form for leads" },
    ],
    codeLines: [
      { num: 1, content: "import React from 'react';", color: "text-foreground" },
      { num: 2, content: "import { Hero } from './components/Hero';", color: "text-foreground" },
      { num: 3, content: "import { Features } from './components/Features';", color: "text-foreground" },
      { num: 4, content: "import { CTA } from './components/CTA';", color: "text-foreground" },
      { num: 5, content: "" },
      { num: 6, content: "export default function App() {", color: "text-foreground" },
      { num: 7, content: "  return (", color: "text-foreground" },
      { num: 8, content: "    <main className=\"min-h-screen bg-white\">", color: "text-foreground" },
      { num: 9, content: "      <Hero", color: "text-red-400" },
      { num: 10, content: "        headline=\"Discover Our Best Sellers\"", color: "text-green-400" },
      { num: 11, content: "        subline=\"Handpicked products loved by 10,000+ customers\"", color: "text-green-400" },
      { num: 12, content: "        ctaText=\"Shop Now\"", color: "text-green-400" },
      { num: 13, content: "        ctaLink=\"/collections/best-sellers\"", color: "text-green-400" },
      { num: 14, content: "      />", color: "text-foreground" },
      { num: 15, content: "      <Features products={topProducts} />", color: "text-red-400" },
      { num: 16, content: "      <CTA", color: "text-red-400" },
      { num: 17, content: "        text=\"Ready to transform your routine?\"", color: "text-green-400" },
      { num: 18, content: "        buttonText=\"Get 15% Off\"", color: "text-green-400" },
      { num: 19, content: "      />", color: "text-foreground" },
      { num: 20, content: "    </main>", color: "text-foreground" },
      { num: 21, content: "  );", color: "text-foreground" },
      { num: 22, content: "}", color: "text-foreground" },
    ],
  },
  {
    id: "10",
    title: "Hottest DTC Nutrition and Fitness...",
    icon: "🔬",
    type: "research",
    fileName: "DTC_Wellness_Report_2026.md",
    editorLabel: "Editor",
    isComplete: false,
    fileTree: [
      { name: "research", type: "folder", expanded: true, children: [
        { name: "nutrition_trends.json", type: "file" },
        { name: "fitness_brands.json", type: "file" },
        { name: "market_data.csv", type: "file" },
      ]},
      { name: "DTC_Wellness_Report_2026.md", type: "file" },
    ],
    computerView: {
      type: "browser",
      browserTabs: [
        { id: "1", title: "about:blank", url: "about:blank", active: false },
        { id: "2", title: "Top 33 Supplement & Vitamin...", url: "clickpost.ai/blog/health-and-wellness-brands-in-usa", favicon: "#10b981", active: true },
      ],
      browserUrl: "https://www.clickpost.ai/blog/health-and-wellness-brands-in-usa",
      browserContent: {
        type: "website",
        siteName: "GLIMPSE",
        pageTitle: "The Top 33 Supplement & Vitamin Trends of 2026",
        sections: [
          { type: "tags", content: "", tags: [
            { label: "All Trends", color: "#3b82f6" },
            { label: "Health & Wellness T...", color: "#6366f1" },
            { label: "Supplement & V...", color: "#8b5cf6" },
            { label: "Nutrition Trends", color: "#a855f7" },
            { label: "Fitness Trends", color: "#d946ef" },
            { label: "Sleep Trends", color: "#ec4899" },
            { label: "Mental Health T...", color: "#f43f5e" },
            { label: "Healthcare Trends", color: "#ef4444" },
            { label: "Personal Care T...", color: "#f97316" },
            { label: "Diet Trends", color: "#eab308" },
          ]},
          { type: "text", content: "Analyst's Note – Below, we'll dive into the top supplement & vitamin trends of 2026, identified using our software and analyzed for their long-term potential and impact on the supplement & vitamin industry." },
          { type: "text", content: "First, here's a look at the fastest-growing supplement & vitamin topics of the past year:" },
          { type: "table", content: "", tableHeaders: ["Rank", "Trending Topic", "Chart", "Growth ⬆", "Categories"],
            tableRows: [
              ["1", "Organ Supple...", "📈", "↑ 296%", "Supplement & Vitamin"],
              ["2", "Creatine for Br...", "📈", "↑ 118%", "Supplement & Vitamin"],
              ["3", "Beef Liver Sup...", "📈", "↑ 94%", "Supplement & Vitamin"],
              ["4", "Perimenopaus...", "📈", "↑ 93%", "Supplement & Vitamin"],
              ["5", "Theanine Sup...", "📈", "↑ 57%", "Supplement & Vitamin"],
              ["6", "Supplements f...", "📈", "↑ 55%", "Supplement & Vitamin"],
              ["7", "Postbiotic", "📈", "↑ 55%", "Supplement & Vitamin, Diet"],
              ["8", "Peptide Suppli...", "📈", "↑ 54%", "Supplement & Vitamin"],
              ["9", "Magnesium fo...", "📈", "↑ 53%", "Supplement & Vitamin"],
            ],
          },
        ],
      },
      searchQuery: "hottest DTC fitness products 2026 trends, top DTC fitness brands 2026 we...",
      searchResults: [
        { title: "The Most Popular Fitness Gear Worth Trying in 2026", url: "fitnessmag.com", date: "Jan 7, 2026", snippet: "Achieve your fitness goals this year with our editors' favorite smart fitness trackers, home gym equipment, and recovery devices.", faviconColor: "#ef4444" },
        { title: "60 Best Fitness Products Of 2026", url: "womenshealthmag.com", date: "Jan 9, 2026", snippet: "Looking for fitness gear you'll use for years? Meet the 2026 Women's Health Fitness Awards winners across equipment, activewear, sneakers, ...", faviconColor: "#f97316" },
        { title: "The 2026 Men's Health Fitness Awards", url: "menshealth.com", date: "Dec 15, 2025", snippet: "From adjustable dumbbells to mountain bikes to a wild new combination rower/bench press/leg press, we've put all the top-tier fitness releases ...", faviconColor: "#ef4444" },
        { title: "New Exercise Equipment Trends Transforming Fitness in ...", url: "techfitness.com", date: "Mar 10, 2026", snippet: "Discover the latest new exercise equipment trends reshaping home workouts in 2026. From AI-powered gear to space-saving designs.", faviconColor: "#10b981" },
        { title: "The Future of Fitness: ACSM Announces Top Trends for 2026", url: "acsm.org", date: "Oct 22, 2025", snippet: "Rounding out the top five fitness trends after Wearable Technology are Fitness Programs for Older Adults, Exercise for Weight Management, Mobile Exercise Apps, ...", faviconColor: "#3b82f6" },
        { title: "Fitness Trends of 2026: The Rise of Yoga, Home ...", url: "yogajournal.com", date: "Jan 28, 2026", snippet: "Free weights are the most likely item among these planned purchases, followed by treadmills, general home gym equipment, and yoga accessories.", faviconColor: "#22c55e" },
        { title: "The Best Wearable Fitness Trackers We Tested for 2026", url: "wirecutter.com", date: "Jan 6, 2026", snippet: "From strength training to sleep and recovery, these wearables stood out for turning raw data into useful action.", faviconColor: "#f43f5e" },
        { title: "The Best Fitness Trackers for Every Type of Exercise", url: "cnet.com", date: "Feb 18, 2026", snippet: "Best fitness tracker overall. Fitbit Charge 6. $135 at Amazon; Best fitness tracker for heart rate. Apple Watch Series 11. $299 at Amazon; Best ...", faviconColor: "#6366f1" },
      ],
      timeline: [
        { id: 1, timestamp: "0:03", type: "search", title: "Searched: hottest DTC nutrition and vitamin products in 2026", snippet: "Initial broad search for trending nutrition and supplement products" },
        { id: 2, timestamp: "0:15", type: "browse", title: "Top 33 Supplement & Vitamin Trends of 2026", domain: "glimpse.co", url: "glimpse.co/trends/supplements", faviconColor: "#10b981", snippet: "Comprehensive trend data with growth percentages across 33 categories", duration: "42s" },
        { id: 3, timestamp: "0:48", type: "save", title: "Saved nutrition and vitamin trends data", snippet: "Extracted growth rates, category rankings, and market signals" },
        { id: 4, timestamp: "1:02", type: "search", title: "Searched: DTC fitness and wellness brand reports 2026", snippet: "Pivoting to fitness and wellness vertical" },
        { id: 5, timestamp: "1:15", type: "browse", title: "Top 33 Health & Wellness Brands in the USA", domain: "clickpost.ai", faviconColor: "#6366f1", snippet: "Leading DTC health and wellness brands with market positioning data", duration: "38s" },
        { id: 6, timestamp: "1:40", type: "browse", title: "Pronto: DTC Fitness Brand Index", domain: "pronto.io", faviconColor: "#f97316", snippet: "Competitive landscape across DTC fitness brands", duration: "25s" },
        { id: 7, timestamp: "1:55", type: "save", title: "Saved DTC health and wellness brand data", snippet: "Compiled brand profiles and growth trajectories" },
        { id: 8, timestamp: "2:10", type: "read", title: "Read saved nutrition and vitamin trends", snippet: "Cross-referencing supplement trends with brand data" },
        { id: 9, timestamp: "2:30", type: "analyze", title: "Identified key trends: organ supplements, brain creatine, hormonal products", snippet: "Gummies favored by Gen Z; brands focusing on stress, gut, and mental health" },
        { id: 10, timestamp: "2:45", type: "search", title: "Searched: DTC fitness product trends 2026 (alt sources)", snippet: "Expanding source coverage" },
        { id: 11, timestamp: "3:00", type: "browse", title: "ACSM Top Fitness Trends for 2026", domain: "acsm.org", faviconColor: "#3b82f6", snippet: "Wearable Tech #1, Exercise for Weight Management, Mobile Exercise Apps", duration: "35s" },
        { id: 12, timestamp: "3:20", type: "analyze", title: "Compiling comprehensive research report", snippet: "Synthesizing data from 12+ sources into final report" },
      ],
    },
    researchTasks: [
      { id: 1, label: "Research DTC nutrition and vitamin trends in 2026", status: "complete" },
      { id: 2, label: "Research DTC fitness and wellness product trends in 2026", status: "complete" },
      { id: 3, label: "Research top DTC brands, market data, and consumer behavior", status: "complete" },
      { id: 4, label: "Compile and write the comprehensive research report", status: "active", elapsed: "1:59", activity: "Thinking" },
      { id: 5, label: "Deliver the final report to the user", status: "pending" },
    ],
    steps: [
      {
        id: 1, label: "Research DTC nutrition and vitamin trends in 2026", detail: "Searching the web for 2026 nutrition and supplement trends", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:03", text: "Search for hottest DTC nutrition and vitamin products in 2026.", type: "action" },
          { time: "0:15", text: "I found recent sources highlighting 2026 DTC nutrition trends like collagen, gut health, and personalized supplements, plus top brands like Ritual and Athletic Greens.", type: "result" },
          { time: "0:22", text: "Search for hottest DTC fitness and wellness products in 2026.", type: "action" },
          { time: "0:35", text: "Visit Glimpse and Pronto to get detailed DTC nutrition and vitamin trends for 2026.", type: "action" },
          { time: "0:48", text: "Save nutrition and vitamin trends for 2026.", type: "action" },
        ],
        subTasks: [
          { text: "Search for hottest DTC nutrition and vitamin products in 2026.", type: "terminal" },
          { text: "Visit Glimpse and Pronto to get detailed DTC nutrition and vitamin trends for 2026.", type: "terminal" },
          { text: "Save nutrition and vitamin trends for 2026.", type: "edit" },
        ],
      },
      {
        id: 2, label: "Research DTC fitness and wellness product trends in 2026", detail: "Browsing fitness and wellness market reports", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "1:02", text: "Handling browser issue", type: "action" },
          { time: "1:15", text: "Search for accessible DTC fitness and wellness brand reports for 2026.", type: "action" },
          { time: "1:28", text: "Found top DTC fitness and wellness brands for 2026, including Nike, Adidas, Athleta, and supplement brands like Ritual and Athletic Greens.", type: "result" },
          { time: "1:40", text: "Visit ClickPost and Pronto to get detailed DTC health and wellness brand trends for 2026.", type: "action" },
          { time: "1:55", text: "Save DTC health and wellness brand data for 2026.", type: "action" },
        ],
        subTasks: [
          { text: "Search for accessible DTC fitness and wellness brand reports for 2026.", type: "terminal" },
          { text: "Visit ClickPost and Pronto to get detailed DTC health and wellness brand trends for 2026.", type: "terminal" },
          { text: "Save DTC health and wellness brand data for 2026.", type: "edit" },
        ],
      },
      {
        id: 3, label: "Compile and write the comprehensive research report", detail: "Reading saved data and synthesizing into a comprehensive report", status: "active",
        icon: <FileText size={14} />,
        logs: [
          { time: "2:10", text: "Read the saved nutrition and vitamin trends.", type: "action" },
          { time: "2:18", text: "Read the saved DTC health and wellness brand data.", type: "action" },
          { time: "2:30", text: "Identified key trends: growth in organ supplements, brain creatine, hormonal and child-specific products, with gummies favored by Gen Z and adults; brands focus on stress, gut, and mental health.", type: "result" },
          { time: "2:45", text: "Search for DTC fitness product trends and brands for 2026 from alternative sources.", type: "action" },
          { time: "3:00", text: "Visit ACSM to get detailed DTC fitness and wellness trends for 2026.", type: "action" },
        ],
        subTasks: [
          { text: "Read the saved nutrition and vitamin trends.", type: "edit" },
          { text: "Read the saved DTC health and wellness brand data.", type: "edit" },
          { text: "Search for DTC fitness product trends and brands for 2026 from alternative sources.", type: "terminal" },
          { text: "Visit ACSM to get detailed DTC fitness and wellness trends for 2026.", type: "terminal" },
        ],
      },
      {
        id: 4, label: "Deliver the final report to the user", detail: "Finalizing and delivering the report", status: "pending",
        icon: <Sparkles size={14} />,
        logs: [],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Can you conduct a deep research on what the hottest DTC products are in 2026 in nutrition products like vitamines, fitness prodcuts etc" },
      { id: "2", role: "assistant", content: "I will conduct a deep research on the hottest DTC nutrition and fitness products for 2026 and prepare a comprehensive report for you." },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "Summarize the report's insights on the most promising DTC nutrition products for 2026." },
      { icon: <TrendingUp size={16} />, text: "Identify the emerging trends in DTC fitness products highlighted in the report." },
      { icon: <FileText size={16} />, text: "Create a presentation about the key findings from the DTC Wellness Report 2026." },
    ],
    codeLines: [
      { num: 1, content: "# DTC Wellness Report 2026", color: "text-red-400" },
      { num: 2, content: "" },
      { num: 3, content: "## 1. Executive Summary", color: "text-red-400" },
      { num: 4, content: "" },
      { num: 5, content: "This report provides a comprehensive analysis of the hottest", color: "text-foreground" },
      { num: 6, content: "Direct-to-Consumer (DTC) products in nutrition, vitamins,", color: "text-foreground" },
      { num: 7, content: "fitness, and related wellness categories for 2026.", color: "text-foreground" },
      { num: 8, content: "" },
      { num: 9, content: "## 2. Key DTC Nutrition and Vitamin Trends [1][2]", color: "text-red-400" },
      { num: 10, content: "" },
      { num: 11, content: "### 2.1 Top Trending Supplement Categories", color: "text-red-400" },
      { num: 12, content: "" },
      { num: 13, content: "1. **Organ Supplements**: Nose-to-tail nutrition with liver,", color: "text-foreground" },
      { num: 14, content: "   heart, and kidney capsules seeing 296% growth.", color: "text-foreground" },
      { num: 15, content: "2. **Creatine for Brain Health**: Beyond athletic performance,", color: "text-foreground" },
      { num: 16, content: "   creatine is marketed for cognitive enhancement (118% growth).", color: "text-foreground" },
      { num: 17, content: "3. **Exercise for Weight Management**: This trend has gained", color: "text-foreground" },
      { num: 18, content: "   prominence, particularly with the increased use of obesity", color: "text-foreground" },
      { num: 19, content: "   management medications like GLP-1 RAs.", color: "text-foreground" },
      { num: 20, content: "4. **Mobile Exercise Apps**: Mobile applications continue to", color: "text-foreground" },
      { num: 21, content: "   be a cornerstone of fitness, offering guided workouts.", color: "text-foreground" },
      { num: 22, content: "5. **Balance, Flow, and Core Strength**: There's a noticeable", color: "text-foreground" },
      { num: 23, content: "   shift towards more holistic and functional fitness approaches.", color: "text-foreground" },
      { num: 24, content: "" },
      { num: 25, content: "### 2.2 Other Notable Trends in Fitness and Wellness [3]", color: "text-red-400" },
      { num: 26, content: "" },
      { num: 27, content: "- **Adult Recreation and Sport Clubs**: The rise in popularity", color: "text-foreground" },
      { num: 28, content: "  of activities like Pickleball and a general desire for social", color: "text-foreground" },
      { num: 29, content: "  connection through exercise.", color: "text-foreground" },
      { num: 30, content: "- **Hyper-Personalized Fitness**: The industry is moving towards", color: "text-foreground" },
      { num: 31, content: "  highly individualized fitness plans, leveraging AI and data.", color: "text-foreground" },
      { num: 32, content: "- **Home Gym Equipment**: Despite the return to gyms, home", color: "text-foreground" },
      { num: 33, content: "  fitness remains strong, with free weights, treadmills, and", color: "text-foreground" },
      { num: 34, content: "  yoga accessories being popular purchases.", color: "text-foreground" },
      { num: 35, content: "- **Recovery Tools**: Increased focus on post-workout recovery", color: "text-foreground" },
      { num: 36, content: "  is leading to demand for smart recovery devices.", color: "text-foreground" },
      { num: 37, content: "" },
      { num: 38, content: "### 2.3 Key DTC Fitness and Wellness Brands [2] [3]", color: "text-red-400" },
      { num: 39, content: "" },
      { num: 40, content: "| Brand | Category | Key Product | Growth |", color: "text-foreground" },
      { num: 41, content: "| :---- | :---- | :---- | :---- |", color: "text-muted-foreground" },
      { num: 42, content: "| **AG1 (Athletic Greens)** | Daily Nutrition | Comprehensive powder | ↑ High |", color: "text-foreground" },
      { num: 43, content: "| **Oura Ring** | Wearable Health | Sleep tracker | ↑ High |", color: "text-foreground" },
      { num: 44, content: "| **Moon Juice** | Adaptogens | Wellness \"dusts\" | ↑ Medium |", color: "text-foreground" },
      { num: 45, content: "| **Four Sigmatic** | Mushroom Coffee | Functional blends | ↑ Medium |", color: "text-foreground" },
      { num: 46, content: "| **Steel Supplements** | Fitness | Performance supps | ↑ High |", color: "text-foreground" },
      { num: 47, content: "" },
      { num: 48, content: "## 3. Market Dynamics and Consumer Behavior", color: "text-red-400" },
      { num: 49, content: "" },
      { num: 50, content: "### Market Stats (2026)", color: "text-red-400" },
      { num: 51, content: "- **US Dietary Supplements Market**: $68.74 billion in 2025", color: "text-foreground" },
      { num: 52, content: "- **US Vitamin Supplements Market**: $15.06 billion in 2024", color: "text-foreground" },
      { num: 53, content: "- **US Herbal Dietary Supplement Sales**: $13.231 billion", color: "text-foreground" },
      { num: 54, content: "- **Global Wearable Technology Market**: $84.53 billion", color: "text-foreground" },
    ],
  },
  {
    id: "11",
    title: "2026 DTC Wellness Market Report...",
    icon: "✅",
    type: "research",
    fileName: "DTC_Wellness_Complete_2026.md",
    editorLabel: "Editor",
    isComplete: true,
    fileTree: [
      { name: "research", type: "folder", expanded: true, children: [
        { name: "nutrition_trends.json", type: "file" },
        { name: "fitness_brands.json", type: "file" },
        { name: "market_data.csv", type: "file" },
        { name: "consumer_survey.json", type: "file" },
      ]},
      { name: "DTC_Wellness_Complete_2026.md", type: "file" },
      { name: "references.md", type: "file" },
    ],
    computerView: {
      type: "editor",
      timeline: [
        { id: 1, timestamp: "0:03", type: "search", title: "Searched: hottest DTC nutrition and vitamin products 2026" },
        { id: 2, timestamp: "0:15", type: "browse", title: "Top 33 Supplement & Vitamin Trends of 2026", domain: "glimpse.co", faviconColor: "#10b981", duration: "42s" },
        { id: 3, timestamp: "0:48", type: "save", title: "Saved nutrition and vitamin trends data" },
        { id: 4, timestamp: "1:02", type: "search", title: "Searched: DTC fitness and wellness brand reports 2026" },
        { id: 5, timestamp: "1:15", type: "browse", title: "Top 33 Health & Wellness Brands in the USA", domain: "clickpost.ai", faviconColor: "#6366f1", duration: "38s" },
        { id: 6, timestamp: "1:40", type: "browse", title: "Pronto: DTC Fitness Brand Index", domain: "pronto.io", faviconColor: "#f97316", duration: "25s" },
        { id: 7, timestamp: "1:55", type: "save", title: "Saved DTC health and wellness brand data" },
        { id: 8, timestamp: "2:10", type: "read", title: "Read saved nutrition and vitamin trends" },
        { id: 9, timestamp: "2:30", type: "analyze", title: "Identified key trends: organ supplements, brain creatine, hormonal products" },
        { id: 10, timestamp: "2:45", type: "search", title: "Searched: DTC fitness trends 2026 (alt sources)" },
        { id: 11, timestamp: "3:00", type: "browse", title: "ACSM Top Fitness Trends for 2026", domain: "acsm.org", faviconColor: "#3b82f6", duration: "35s" },
        { id: 12, timestamp: "3:20", type: "analyze", title: "Compiled final report from 12+ sources" },
        { id: 13, timestamp: "3:25", type: "save", title: "Delivered DTC_Wellness_Complete_2026.md to user" },
      ],
    },
    researchTasks: [
      { id: 1, label: "Research DTC nutrition and vitamin trends in 2026", status: "complete" },
      { id: 2, label: "Research DTC fitness and wellness product trends in 2026", status: "complete" },
      { id: 3, label: "Research top DTC brands, market data, and consumer behavior", status: "complete" },
      { id: 4, label: "Compile and write the comprehensive research report", status: "complete" },
      { id: 5, label: "Deliver the final report to the user", status: "complete" },
    ],
    steps: [
      {
        id: 1, label: "Research DTC nutrition and vitamin trends", detail: "Searched web and visited industry sources", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "0:03", text: "Search for hottest DTC nutrition and vitamin products in 2026.", type: "action" },
          { time: "0:22", text: "Found 33 trending supplement categories from Glimpse.", type: "result" },
        ],
        subTasks: [
          { text: "Search for hottest DTC nutrition and vitamin products in 2026.", type: "terminal" },
          { text: "Visit Glimpse for detailed supplement trend data.", type: "terminal" },
          { text: "Save nutrition and vitamin trends for 2026.", type: "edit" },
        ],
      },
      {
        id: 2, label: "Research DTC fitness and wellness trends", detail: "Browsed fitness publications and market reports", status: "complete",
        icon: <Search size={14} />,
        logs: [
          { time: "1:02", text: "Search for accessible DTC fitness brand reports for 2026.", type: "action" },
          { time: "1:40", text: "Found top DTC fitness and wellness brands including Nike DTC, Athleta, Ritual.", type: "result" },
        ],
        subTasks: [
          { text: "Search for DTC fitness and wellness brand reports.", type: "terminal" },
          { text: "Visit ClickPost for health and wellness brand data.", type: "terminal" },
        ],
      },
      {
        id: 3, label: "Compile research report", detail: "Synthesized all data into final report", status: "complete",
        icon: <FileText size={14} />,
        logs: [
          { time: "2:10", text: "Read saved nutrition and vitamin trends.", type: "action" },
          { time: "2:45", text: "Search for DTC fitness trends from alternative sources.", type: "action" },
          { time: "3:20", text: "Report compiled: DTC_Wellness_Complete_2026.md (54 lines).", type: "result" },
        ],
      },
      {
        id: 4, label: "Deliver the final report", detail: "Report delivered with summary and data tables", status: "complete",
        icon: <Sparkles size={14} />,
        logs: [
          { time: "3:25", text: "Final report delivered to user.", type: "result" },
        ],
      },
    ],
    messages: [
      { id: "1", role: "user", content: "Can you conduct a deep research on what the hottest DTC products are in 2026 in nutrition products like vitamines, fitness products etc" },
      { id: "2", role: "assistant", content: "I've completed the in-depth research on the hottest DTC products in nutrition, vitamins, and fitness for 2026. Here's the comprehensive report with all findings.",
        hasReport: true,
        reportTitle: "DTC Wellness Market Report 2026: Nutrition, Vitamins & Fitness",
        reportSummary: "A comprehensive analysis of the top DTC wellness products, emerging trends, and market dynamics across nutrition, supplements, and fitness categories for 2026. Based on data from Glimpse, ACSM, ClickPost, and 12+ industry sources.",
        tableData: {
          headers: ["Category", "Top Trend", "Growth", "Market Size"],
          rows: [
            ["Organ Supplements", "Liver & kidney capsules", "↑ 296%", "$2.1B"],
            ["Brain Creatine", "Cognitive enhancement", "↑ 118%", "$890M"],
            ["Beef Liver Supps", "Ancestral nutrition", "↑ 94%", "$340M"],
            ["Wearable Tech", "AI-powered trackers", "↑ 47%", "$84.5B"],
            ["Adaptogens", "Stress & mood support", "↑ 55%", "$4.2B"],
          ],
        },
      },
    ],
    followUps: [
      { icon: <Search size={16} />, text: "Which DTC nutrition brands have the highest customer retention rates?" },
      { icon: <TrendingUp size={16} />, text: "Create a competitive analysis of the top 5 organ supplement brands." },
      { icon: <FlaskConical size={16} />, text: "Research the science behind the creatine-for-brain-health trend." },
      { icon: <HelpCircle size={16} />, text: "What marketing strategies are driving growth in the adaptogen category?" },
    ],
    codeLines: [
      { num: 1, content: "# DTC Wellness Market Report 2026", color: "text-red-400" },
      { num: 2, content: "## Nutrition, Vitamins & Fitness", color: "text-red-400" },
      { num: 3, content: "" },
      { num: 4, content: "**Research completed** · 12 sources analyzed · 3:25 elapsed", color: "text-foreground" },
      { num: 5, content: "" },
      { num: 6, content: "## 1. Executive Summary", color: "text-red-400" },
      { num: 7, content: "" },
      { num: 8, content: "This report provides a comprehensive analysis of the hottest", color: "text-foreground" },
      { num: 9, content: "Direct-to-Consumer (DTC) products in nutrition, vitamins,", color: "text-foreground" },
      { num: 10, content: "fitness, and related wellness categories for 2026.", color: "text-foreground" },
      { num: 11, content: "" },
      { num: 12, content: "## 2. Key DTC Nutrition and Vitamin Trends", color: "text-red-400" },
      { num: 13, content: "" },
      { num: 14, content: "### 2.1 Top Trending Supplement Categories", color: "text-red-400" },
      { num: 15, content: "" },
      { num: 16, content: "1. **Organ Supplements**: Nose-to-tail nutrition with liver,", color: "text-foreground" },
      { num: 17, content: "   heart, and kidney capsules seeing 296% growth.", color: "text-foreground" },
      { num: 18, content: "2. **Creatine for Brain Health**: Beyond athletic performance,", color: "text-foreground" },
      { num: 19, content: "   creatine is marketed for cognitive enhancement (118% growth).", color: "text-foreground" },
      { num: 20, content: "3. **Beef Liver Supplements**: Ancestral health movement driving", color: "text-foreground" },
      { num: 21, content: "   94% growth in grass-fed liver capsules.", color: "text-foreground" },
      { num: 22, content: "" },
      { num: 23, content: "### 2.2 DTC Fitness & Wellness Trends", color: "text-red-400" },
      { num: 24, content: "" },
      { num: 25, content: "- **Wearable Technology**: Remains #1 fitness trend (ACSM 2026)", color: "text-foreground" },
      { num: 26, content: "- **Exercise for Weight Management**: GLP-1 era driving demand", color: "text-foreground" },
      { num: 27, content: "- **Mobile Exercise Apps**: AI-powered personalization wave", color: "text-foreground" },
      { num: 28, content: "- **Home Gym Equipment**: Free weights, treadmills, yoga gear", color: "text-foreground" },
      { num: 29, content: "" },
      { num: 30, content: "## 3. Market Dynamics", color: "text-red-400" },
      { num: 31, content: "" },
      { num: 32, content: "| Market | Size (2025-26) | Growth |", color: "text-foreground" },
      { num: 33, content: "| :---- | :---- | :---- |", color: "text-muted-foreground" },
      { num: 34, content: "| US Dietary Supplements | $68.74B | ↑ 8.2% |", color: "text-foreground" },
      { num: 35, content: "| US Vitamin Supplements | $15.06B | ↑ 6.1% |", color: "text-foreground" },
      { num: 36, content: "| Global Wearable Tech | $84.53B | ↑ 12.4% |", color: "text-foreground" },
      { num: 37, content: "| US Herbal Supplements | $13.23B | ↑ 9.7% |", color: "text-foreground" },
      { num: 38, content: "" },
      { num: 39, content: "## 4. Top DTC Brands to Watch", color: "text-red-400" },
      { num: 40, content: "" },
      { num: 41, content: "| Brand | Category | Standout Product |", color: "text-foreground" },
      { num: 42, content: "| :---- | :---- | :---- |", color: "text-muted-foreground" },
      { num: 43, content: "| AG1 (Athletic Greens) | Daily Nutrition | Comprehensive powder |", color: "text-foreground" },
      { num: 44, content: "| Oura Ring | Wearable | Sleep & recovery tracker |", color: "text-foreground" },
      { num: 45, content: "| Moon Juice | Adaptogens | Wellness \"dusts\" |", color: "text-foreground" },
      { num: 46, content: "| Ritual | Vitamins | Traceable multivitamins |", color: "text-foreground" },
      { num: 47, content: "| Steel Supplements | Fitness | Performance supps |", color: "text-foreground" },
      { num: 48, content: "" },
      { num: 49, content: "## 5. Conclusion", color: "text-red-400" },
      { num: 50, content: "" },
      { num: 51, content: "The DTC wellness market in 2026 is characterized by a shift", color: "text-foreground" },
      { num: 52, content: "toward science-backed, highly personalized products. Key growth", color: "text-foreground" },
      { num: 53, content: "drivers include ancestral health trends, cognitive supplements,", color: "text-foreground" },
      { num: 54, content: "and AI-powered wearables bridging fitness and healthcare.", color: "text-foreground" },
    ],
  },
];

export function getConversation(id: string): Conversation {
  return conversations.find((c) => c.id === id) || conversations[0];
}
