import { z } from "zod";
import { EventDraft as _EventDraft, Schema, Reporter } from "@bgord/node";
import Emittery from "emittery";

import * as VO from "./value-objects";
import * as Services from "./services";

import { ArticleRepository } from "./repositories/article-repository";
import { NewspaperRepository } from "./repositories/newspaper-repository";
import { StatsRepository } from "./repositories/stats-repository";

import { Article } from "./aggregates/article";
import { Newspaper } from "./aggregates/newspaper";

const Stream = z.string().nonempty();
export type StreamType = z.infer<typeof Stream>;

const EventDraft = _EventDraft.merge(z.object({ stream: Stream }));

export const ARTICLE_ADDED_EVENT = "ARTICLE_ADDED_EVENT";
export const ArticleAddedEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARTICLE_ADDED_EVENT),
    version: z.literal(1),
    payload: VO.Article.merge(VO.ArticleMetatags),
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

export const ARTICLE_PROCESSED_EVENT = "ARTICLE_PROCESSED_EVENT";
export const ArticleProcessedEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARTICLE_PROCESSED_EVENT),
    version: z.literal(1),
    payload: z.object({ articleId: VO.ArticleId }),
  })
);
export type ArticleProcessedEventType = z.infer<typeof ArticleProcessedEvent>;

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

export const ARBITRARY_FILE_SCHEDULED_EVENT = "ARBITRARY_FILE_SCHEDULED_EVENT";
export const ArbitraryFileScheduledEvent = EventDraft.merge(
  z.object({
    name: z.literal(ARBITRARY_FILE_SCHEDULED_EVENT),
    version: z.literal(1),
    payload: Schema.UploadedFile,
  })
);
export type ArbitraryFileScheduledEventType = z.infer<
  typeof ArbitraryFileScheduledEvent
>;

Emittery.isDebugEnabled = true;

export const emittery = new Emittery<{
  ARTICLE_ADDED_EVENT: ArticleAddedEventType;
  ARTICLE_DELETED_EVENT: ArticleDeletedEventType;
  ARTICLE_LOCKED_EVENT: ArticleLockedEventType;
  ARTICLE_PROCESSED_EVENT: ArticleProcessedEventType;
  NEWSPAPER_SCHEDULED_EVENT: NewspaperScheduledEventType;
  NEWSPAPER_GENERATED_EVENT: NewspaperGenerateEventType;
  NEWSPAPER_SENT_EVENT: NewspaperSentEventType;
  NEWSPAPER_ARCHIVED_EVENT: NewspaperArchivedEventType;
  NEWSPAPER_FAILED_EVENT: NewspaperFailedEventType;
  ARBITRARY_FILE_SCHEDULED_EVENT: ArbitraryFileScheduledEventType;
}>();

emittery.on(ARTICLE_ADDED_EVENT, async (event) => {
  await ArticleRepository.create(event.payload);
  await StatsRepository.incrementCreatedArticles();
});

emittery.on(ARTICLE_DELETED_EVENT, async (event) => {
  await ArticleRepository.delete(event.payload.articleId);
});

emittery.on(ARTICLE_LOCKED_EVENT, async (event) => {
  await ArticleRepository.updateStatus(
    event.payload.articleId,
    VO.ArticleStatusEnum.in_progress
  );

  await ArticleRepository.assignToNewspaper(
    event.payload.articleId,
    event.payload.newspaperId
  );
});

emittery.on(ARTICLE_PROCESSED_EVENT, async (event) => {
  await ArticleRepository.updateStatus(
    event.payload.articleId,
    VO.ArticleStatusEnum.processed
  );
});

emittery.on(NEWSPAPER_SCHEDULED_EVENT, async (event) => {
  await NewspaperRepository.create({
    id: event.payload.id,
    scheduledAt: event.payload.createdAt,
    status: VO.NewspaperStatusEnum.scheduled,
  });

  for (const entity of event.payload.articles) {
    const article = await new Article(entity.id).build();
    await article.lock(event.payload.id);
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
  await StatsRepository.incrementSentNewspapers();

  await NewspaperRepository.updateStatus(
    event.payload.newspaperId,
    VO.NewspaperStatusEnum.delivered
  );

  await NewspaperRepository.updateSentAt(
    event.payload.newspaperId,
    event.payload.sentAt
  );

  for (const entity of event.payload.articles) {
    const article = await new Article(entity.id).build();
    await article.markAsProcessed();
  }

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

emittery.on(ARBITRARY_FILE_SCHEDULED_EVENT, async (event) => {
  try {
    await Services.ArbitraryFileSender.send(event.payload);
    Reporter.success(`File sent [name=${event.payload.originalFilename}]`);
  } catch (error) {
    Reporter.raw("Mailer error", error);
    Reporter.error(`File not sent [name=${event.payload.originalFilename}]`);
  } finally {
    await new Services.UploadedFile(event.payload).delete();
  }
});
