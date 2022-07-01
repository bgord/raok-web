import express from "express";
import render from "preact-render-to-string";

import * as Services from "../services";
import { TestComponent } from "../frontend/test";

export async function Test(
  request: express.Request,
  response: express.Response,
  _next: express.NextFunction
) {
  const frontend = render(TestComponent());

  const html = Services.Html.process({
    frontend,
    state: {},
    language: request.language,
  });

  return response.send(html);
}
