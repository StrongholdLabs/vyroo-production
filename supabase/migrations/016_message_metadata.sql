-- Add metadata JSONB column to messages for persisting report card data
-- (hasReport, reportTitle, reportSummary, tableData)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
