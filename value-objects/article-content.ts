import { z } from "zod";
import { Brand, toBrand } from "@bgord/node";

export type ArticleContentType = Brand<
  "article-content",
  z.infer<typeof ArticleContentSchema>
>;

const ArticleContentSchema = z.string().max(100000);

export const ArticleContent = toBrand<ArticleContentType>(ArticleContentSchema);
