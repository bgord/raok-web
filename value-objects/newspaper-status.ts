import { z } from "zod";

/* eslint-disable no-shadow */
export enum NewspaperStatusEnum {
  /* eslint-disable no-unused-vars */
  "undetermined" = "undetermined",
  "scheduled" = "scheduled",
  "ready_to_send" = "ready_to_send",
  "delivered" = "delivered",
}

export const NewspaperStatus = z
  .nativeEnum(NewspaperStatusEnum)
  .default(NewspaperStatusEnum.undetermined);

export type NewspaperStatusType = z.infer<typeof NewspaperStatus>;