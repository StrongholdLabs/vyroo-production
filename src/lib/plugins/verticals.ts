import type { VerticalType } from "./types";

export interface VerticalMeta {
  id: VerticalType;
  name: string;
  description: string;
  iconName: string;
  color: string; // tailwind color
}

export const verticals: Record<VerticalType, VerticalMeta> = {
  general: {
    id: "general",
    name: "General Purpose",
    description: "Default Vyroo experience with core AI capabilities",
    iconName: "sparkles",
    color: "blue",
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Shopify, inventory, orders, and storefront management",
    iconName: "shopping-cart",
    color: "green",
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    description: "Patient management, scheduling, and clinical workflows",
    iconName: "heart-pulse",
    color: "red",
  },
  education: {
    id: "education",
    name: "Education",
    description: "Curriculum planning, student analytics, and LMS integration",
    iconName: "graduation-cap",
    color: "purple",
  },
  finance: {
    id: "finance",
    name: "Finance",
    description: "Portfolio tracking, risk analysis, and financial reporting",
    iconName: "landmark",
    color: "amber",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    description: "Campaign management, analytics, and content creation",
    iconName: "megaphone",
    color: "pink",
  },
  devtools: {
    id: "devtools",
    name: "Developer Tools",
    description: "CI/CD, code review, and infrastructure management",
    iconName: "terminal",
    color: "cyan",
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "Build your own vertical with custom plugins",
    iconName: "puzzle",
    color: "gray",
  },
};

export function getVertical(type: VerticalType): VerticalMeta {
  return verticals[type];
}
