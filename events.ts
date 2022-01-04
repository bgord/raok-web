import { z } from "zod";
import { EventDraft, Schema } from "@bgord/node";
import Emittery from "emittery";

import * as VO from "./value-objects";
import * as Services from "./services";

import { ArticleRepository } from "./repositories/article-repository";
import { NewspaperRepository } from "./repositories/newspaper-repository";
import { StatsRepository } from "./repositories/stats-repository";
import { Newspaper } from "./aggregates/newspaper";

export const ARTICLE_ADDED_EVENT = "ARTICLE_ADDED_EVENT";
export const ArticleAddedEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARTICLE_ADDED_EVENT),
    version: z.literal(1),
    payload: VO.Article,
  })
);
export type ArticleAddedEventType = z.infer<typeof ArticleAddedEvent>;

export const ARTICLE_DELETED_EVENT = "ARTICLE_DELETED_EVENT";
export const ArticleDeletedEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARTICLE_DELETED_EVENT),
    version: z.literal(1),
    payload: z.object({ articleId: VO.ArticleId }),
  })
);
export type ArticleDeletedEventType = z.infer<typeof ArticleDeletedEvent>;

export const ARTICLE_LOCKED_EVENT = "ARTICLE_LOCKED_EVENT";
export const ArticleLockedEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARTICLE_LOCKED_EVENT),
    version: z.literal(1),
    payload: z.object({ articleId: VO.ArticleId, newspaperId: VO.NewspaperId }),
  })
);
export type ArticleLockedEventType = z.infer<typeof ArticleLockedEvent>;

export const NEWSPAPER_SCHEDULED_EVENT = "NEWSPAPER_SCHEDULED_EVENT";
export const NewspaperScheduledEvent = EventDraft.merge(
  z.object({
    name: z.literal(NEWSPAPER_SCHEDULED_EVENT),
    version: z.literal(1),
    payload: z.object({
      id: VO.NewspaperId,
      articles: VO.Newspaper._def.shape().articles,
      createdAt: Schema.Timestamp,
    }),
  })
);
export type NewspaperScheduledEventType = z.infer<
  typeof NewspaperScheduledEvent
>;

export const NEWSPAPER_GENERATED_EVENT = "NEWSPAPER_GENERATED_EVENT";
export const NewspaperGenerateEvent = EventDraft.merge(
  z.object({
    name: z.literal(NEWSPAPER_GENERATED_EVENT),
    version: z.literal(1),
    payload: z.object({ newspaperId: VO.NewspaperId }),
  })
);
export type NewspaperGenerateEventType = z.infer<typeof NewspaperGenerateEvent>;

export const NEWSPAPER_SENT_EVENT = "NEWSPAPER_SENT_EVENT";
export const NewspaperSentEvent = EventDraft.merge(
  z.object({
    name: z.literal(NEWSPAPER_SENT_EVENT),
    version: z.literal(1),
    payload: z.object({
      newspaperId: VO.NewspaperId,
      articles: VO.Newspaper._def.shape().articles,
      sentAt: VO.Newspaper._def.shape().sentAt,
    }),
  })
);
export type NewspaperSentEventType = z.infer<typeof NewspaperSentEvent>;

export const NEWSPAPER_ARCHIVED_EVENT = "NEWSPAPER_ARCHIVED_EVENT";
export const NewspaperArchivedEvent = EventDraft.merge(
  z.object({
    name: z.literal(NEWSPAPER_ARCHIVED_EVENT),
    version: z.literal(1),
    payload: z.object({ newspaperId: VO.NewspaperId }),
  })
);
export type NewspaperArchivedEventType = z.infer<typeof NewspaperArchivedEvent>;

export const NEWSPAPER_FAILED_EVENT = "NEWSPAPER_FAILED_EVENT";
export const NewspaperFailedEvent = EventDraft.merge(
  z.object({
    name: z.literal(NEWSPAPER_FAILED_EVENT),
    version: z.literal(1),
    payload: z.object({ newspaperId: VO.NewspaperId }),
  })
);
export type NewspaperFailedEventType = z.infer<typeof NewspaperFailedEvent>;

Emittery.isDebugEnabled = true;

export const emittery = new Emittery<{
  ARTICLE_ADDED_EVENT: ArticleAddedEventType;
  ARTICLE_DELETED_EVENT: ArticleDeletedEventType;
  ARTICLE_LOCKED_EVENT: ArticleLockedEventType;
  NEWSPAPER_SCHEDULED_EVENT: NewspaperScheduledEventType;
  NEWSPAPER_GENERATED_EVENT: NewspaperGenerateEventType;
  NEWSPAPER_SENT_EVENT: NewspaperSentEventType;
  NEWSPAPER_ARCHIVED_EVENT: NewspaperArchivedEventType;
  NEWSPAPER_FAILED_EVENT: NewspaperFailedEventType;
}>();

emittery.on(ARTICLE_ADDED_EVENT, async (event) => {
  await ArticleRepository.create(event.payload);
  await StatsRepository.incrementCreatedArticles();
});

emittery.on(ARTICLE_DELETED_EVENT, async (event) => {
  await ArticleRepository.delete(event.payload.articleId);
});

emittery.on(NEWSPAPER_SCHEDULED_EVENT, async (event) => {
  await NewspaperRepository.create({
    id: event.payload.id,
    scheduledAt: event.payload.createdAt,
    status: VO.NewspaperStatusEnum.scheduled,
  });

  for (const article of event.payload.articles) {
    await ArticleRepository.updateStatus(
      article.id,
      VO.ArticleStatusEnum.in_progress
    );

    await ArticleRepository.assignToNewspaper(article.id, event.payload.id);
  }

  const newspaper = await new Newspaper(event.payload.id).build();

  await newspaper.generate();
});

emittery.on(NEWSPAPER_GENERATED_EVENT, async (event) => {
  await NewspaperRepository.updateStatus(
    event.payload.newspaperId,
    VO.NewspaperStatusEnum.ready_to_send
  );

  const newspaper = await new Newspaper(event.payload.newspaperId).build();
  await newspaper.send();
});

emittery.on(NEWSPAPER_SENT_EVENT, async (event) => {
  for (const article of event.payload.articles) {
    await ArticleRepository.updateStatus(
      article.id,
      VO.ArticleStatusEnum.processed
    );
  }

  await NewspaperRepository.updateStatus(
    event.payload.newspaperId,
    VO.NewspaperStatusEnum.delivered
  );

  await NewspaperRepository.updateSentAt(
    event.payload.newspaperId,
    event.payload.sentAt
  );

  await Services.NewspaperFile.delete(event.payload.newspaperId);
});

emittery.on(NEWSPAPER_ARCHIVED_EVENT, async (event) => {
  await NewspaperRepository.updateStatus(
    event.payload.newspaperId,
    VO.NewspaperStatusEnum.archived
  );
});

emittery.on(NEWSPAPER_FAILED_EVENT, async (event) => {
  await NewspaperRepository.updateStatus(
    event.payload.newspaperId,
    VO.NewspaperStatusEnum.error
  );
});
