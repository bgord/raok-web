import express from "express";

import * as VO from "../value-objects";
import { Newspaper } from "../aggregates/newspaper";

export async function RetryNewspaper(
  request: express.Request,
  response: express.Response,
  _next: express.NextFunction
) {
  const newspaperId = VO.Newspaper._def
    .shape()
    .id.parse(request.params.newspaperId);

  const newspaper = await new Newspaper(newspaperId).build();
  await newspaper.retry();

  return response.redirect("/dashboard");
}
