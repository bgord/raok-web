import {
  ArticleType,
  ArticlePayloadType,
  NewspaperType,
  StatsType,
} from "./types";

export const _api: typeof fetch = (input, init) =>
  fetch(input, {
    mode: "same-origin",
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
    ...init,
  });

async function getNewspapers(): Promise<NewspaperType[]> {
  return _api("/newspapers").then((response) =>
    response.ok ? response.json() : []
  );
}

async function createNewspaper(articleIds: ArticleType["id"][]) {
  return _api("/create-newspaper", {
    method: "POST",
    body: JSON.stringify({ articleIds }),
  });
}

async function archiveNewspaper(newspaperId: NewspaperType["id"]) {
  return _api(`/archive-newspaper/${newspaperId}`, { method: "POST" });
}

async function resendNewspaper(newspaperId: NewspaperType["id"]) {
  return _api(`/resend-newspaper/${newspaperId}`, { method: "POST" });
}

async function getStats(): Promise<StatsType> {
  const defaultStats: StatsType = { createdArticles: 0 };

  return _api("/stats", { method: "GET" }).then((response) =>
    response.ok ? response.json() : defaultStats
  );
}

async function getArticles(): Promise<ArticleType[]> {
  return _api("/articles", { method: "GET" }).then((response) =>
    response.ok ? response.json() : []
  );
}

async function addArticle(article: ArticlePayloadType) {
  return fetch("/add-article", {
    method: "POST",
    body: JSON.stringify(article),
  });
}

async function deleteArticle(articleId: ArticleType["id"]) {
  return _api(`/delete-article/${articleId}`, { method: "POST" });
}

export const api = {
  getNewspapers,
  createNewspaper,
  archiveNewspaper,
  resendNewspaper,
  getStats,
  getArticles,
  addArticle,
  deleteArticle,
};
