import { z } from "zod";
import { Schema } from "@bgord/node";

import { NewspaperStatus } from "./newspaper-status";
import { TableOfContents } from "./table-of-contents";

export const Newspaper = z.object({
  id: TableOfContents._def.shape().id,
  articles: TableOfContents._def.shape().articles,
  status: NewspaperStatus,
  scheduledAt: Schema.Timestamp,
});

export type NewspaperType = z.infer<typeof Newspaper>;