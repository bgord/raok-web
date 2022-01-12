import express from "express";
import render from "preact-render-to-string";
import serialize from "serialize-javascript";

import { ArticleRepository } from "../repositories/article-repository";
import { NewspaperRepository } from "../repositories/newspaper-repository";
import { StatsRepository } from "../repositories/stats-repository";

import { App } from "../frontend/app";

function Html(content: string, username: string, state: string) {
  return /* HTML */ `
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link as="style" rel="stylesheet preload" href="/normalize.min.css" />
        <link as="style" rel="stylesheet preload" href="/main.min.css" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        <style>
          *[data-toggle="appearing"] {
            opacity: 0;
          }
          *[data-toggle="appeared"] {
            opacity: 1;
            transition: opacity 440ms;
          }
          *[data-toggle="hidding"] {
            opacity: 0;
            transition: opacity 220ms;
          }
          *[data-toggle="hidden"] {
            display: none;
            opacity: 0;
            transition: opacity 220ms;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0px);
            }
          }

          @keyframes slideOut {
            from {
              opacity: 1;
              transform: translateX(0px);
            }
            to {
              opacity: 0;
              transform: translateX(-30px);
            }
          }

          *[data-notification="visible"] {
            animation: slideIn 0.3s ease-out;
          }

          *[data-notification="hidding"] {
            animation: slideOut 0.3s ease-out;
          }
        </style>

        <title>RAOK - read articles on Kindle</title>
      </head>

      <body data-mx="auto">
        <header
          data-display="flex"
          data-p="12"
          data-md-px="12"
          data-bg="gray-800"
        >
          <h1 data-fs="20" data-ls="2" data-color="gray-100" data-fw="500">
            raok
          </h1>

          <div data-display="flex" data-ml="auto" data-mr="72" data-md-mr="24">
            <strong data-ml="12" data-md-ml="6" data-color="white">
              ${username}
            </strong>
          </div>

          <a
            class="c-link"
            data-color="white"
            data-mr="12"
            data-md-mr="0"
            href="/logout"
          >
            Logout
          </a>
        </header>

        <div id="root">${content}</div>

        <script>
          window.__STATE__ = ${state};
        </script>

        <script async src="/index.js"></script>
      </body>
    </html>
  `;
}

export async function Dashboard(
  request: express.Request,
  response: express.Response,
  _next: express.NextFunction
) {
  const articles = await ArticleRepository.getAllNonProcessed();
  const favouriteArticles = await ArticleRepository.getFavourite();
  const newspapers = await NewspaperRepository.getAllNonArchived();
  const stats = await StatsRepository.getAll();

  const initialData = { stats, articles, newspapers, favouriteArticles };
  const app = render(App(initialData));

  return response.send(
    Html(app, request.user as string, serialize(initialData, { isJSON: true }))
  );
}
