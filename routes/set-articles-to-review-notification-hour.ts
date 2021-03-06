import express from "express";

import * as VO from "../value-objects";
import { Settings } from "../aggregates/settings";

export async function SetArticlesToReviewNotificationHour(
  request: express.Request,
  response: express.Response,
  _next: express.NextFunction
): Promise<void> {
  const hour = VO.hour.parse(Number(request.body.hour));

  const settings = await new Settings().build();
  await settings.setArticlesToReviewNotificationHour(hour);

  return response.redirect("/settings");
}
