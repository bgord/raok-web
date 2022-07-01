import express from "express";
import { h } from "preact";
import "preact";
import render from "preact-render-to-string";
import * as bg from "@bgord/node";

import * as Services from "../services";
import * as Repos from "../repositories";

import { App } from "../frontend/app";

export async function Dashboard(
  request: express.Request,
  response: express.Response,
  _next: express.NextFunction
) {
  const translations = await bg.Language.getTranslations(
    request.language,
    request.translationsPath
  );

  const pagination = bg.Pagination.parse(request.query);

  const state = {
    ...Repos.BuildRepository.getAll(),
    language: request.language,
    translations,
    archiveArticles: [],
    archiveNewspapers: [],
    articles: await Repos.ArticleRepository.pagedGetAllNonProcessed(pagination),
    favouriteArticles: await Repos.ArticleRepository.getFavourite(),
    newspapers: await Repos.NewspaperRepository.getAllNonArchived(),
    settings: null,
    stats: null,
  };

  const frontend = render(App({ ...state, url: request.url }));
  const html = Services.Html.process({
    frontend,
    state,
    language: request.language,
  });

  console.log("here2");

  return response.send(html);
}
