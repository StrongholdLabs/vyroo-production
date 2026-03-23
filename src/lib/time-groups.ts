import { isToday, isYesterday, differenceInDays } from "date-fns";

interface ConversationItem {
  id: string;
  title: string;
  icon: string;
  updated_at?: string;
  created_at?: string;
  last_message_preview?: string;
  [key: string]: unknown;
}

export interface TimeGroupedConversations {
  today: ConversationItem[];
  yesterday: ConversationItem[];
  lastWeek: ConversationItem[];
  older: ConversationItem[];
}

/**
 * Groups conversations by time period based on their updated_at or created_at.
 * Returns { today, yesterday, lastWeek, older } arrays.
 */
export function groupConversationsByTime(conversations: ConversationItem[]): TimeGroupedConversations {
  const groups: TimeGroupedConversations = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  for (const conv of conversations) {
    const dateStr = conv.updated_at || conv.created_at;
    if (!dateStr) {
      groups.older.push(conv);
      continue;
    }

    const date = new Date(dateStr);

    if (isToday(date)) {
      groups.today.push(conv);
    } else if (isYesterday(date)) {
      groups.yesterday.push(conv);
    } else if (differenceInDays(new Date(), date) <= 7) {
      groups.lastWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  }

  return groups;
}
