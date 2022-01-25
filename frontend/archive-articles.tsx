import { RoutableProps } from "preact-router";
import { h } from "preact";
import { useQuery } from "react-query";

import * as UI from "./ui";
import { api } from "./api";
import { useSearch, useFilter, useTimestampFilter } from "./hooks";
import { ArticleType, ArticleSourceEnum, ArticleStatusEnum } from "./types";
import { ArchiveArticle } from "./archive-article";

export type InitialArchiveArticlesDataType = {
  archiveArticles: ArticleType[];
};

export function ArchiveArticles(
  props: InitialArchiveArticlesDataType & RoutableProps
) {
  const archiveArticles = useQuery("archive-articles", api.getArchiveArticles, {
    initialData: props.archiveArticles,
  });

  const search = useSearch();
  const source = useFilter({ enum: ArticleSourceEnum });
  const status = useFilter({ enum: ArticleStatusEnum });
  const createdAt = useTimestampFilter({ defaultValue: "last_week" });

  const articles = (archiveArticles.data ?? [])
    .filter((article) => search.filterFn(article.title))
    .filter((article) => source.filterFn(article.source))
    .filter((article) => status.filterFn(article.status))
    .filter((article) => createdAt.filterFn(article.createdAt));

  const numberOfArticles = articles.length;

  return (
    <main
      data-display="flex"
      data-direction="column"
      data-mx="auto"
      data-mt="24"
      data-max-width="768"
      data-width="100%"
    >
      <div
        data-display="flex"
        data-cross="center"
        data-mt="24"
        data-mb="36"
        data-bwt="4"
        data-bct="gray-100"
        data-pt="12"
      >
        <h2 data-fs="20" data-color="gray-800" data-fw="500">
          Archive Articles
        </h2>

        <UI.Badge data-ml="12" data-p="3">
          {numberOfArticles}
        </UI.Badge>
      </div>

      <div data-display="flex" data-cross="end" data-mb="24">
        <div data-position="relative">
          <input
            list="articles"
            onInput={search.onChange}
            value={search.query}
            class="c-input"
            placeholder="Search for an article..."
            style="min-width: 280px; padding-right: 36px"
          />
          <img
            data-position="absolute"
            loading="eager"
            height="34"
            width="34"
            src="/icon-search.svg"
            alt=""
            data-p="6"
            style="top: 1px; right: 1px; background: white"
          />
        </div>

        <button
          onClick={search.clear}
          class="c-button"
          data-variant="bare"
          data-px="3"
          data-ml="6"
          data-mr="auto"
        >
          <img
            loading="eager"
            height="24"
            width="24"
            src="/icon-close.svg"
            alt=""
          />
        </button>

        <div data-display="flex" data-direction="column" data-mr="12">
          <label class="c-label" for="sent-at">
            Sent at
          </label>
          <div class="c-select-wrapper">
            <select
              id="sent-at"
              name="sent-at"
              class="c-select"
              value={createdAt.query}
              onInput={createdAt.onChange}
            >
              <option selected value="all">
                All
              </option>

              {createdAt.options.map((option) => (
                <option value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div data-display="flex" data-direction="column" data-mr="12">
          <label class="c-label" for="status">
            Status
          </label>
          <div class="c-select-wrapper">
            <select
              id="status"
              name="status"
              class="c-select"
              value={status.query}
              onInput={status.onChange}
            >
              <option selected value="all">
                All
              </option>

              {status.options.map((status) => (
                <option value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div data-display="flex" data-direction="column">
          <label class="c-label" for="source">
            Source
          </label>
          <div class="c-select-wrapper">
            <select
              id="source"
              name="source"
              class="c-select"
              value={source.query}
              onInput={source.onChange}
            >
              <option selected value="all">
                All
              </option>

              {source.options.map((source) => (
                <option value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {archiveArticles.isSuccess && archiveArticles.data.length === 0 && (
        <div data-fs="14" data-color="gray-700">
          No archive articles.
        </div>
      )}

      <datalist id="articles">
        {archiveArticles.data?.map((article) => (
          <option value={article.title} />
        ))}
      </datalist>

      <ul data-display="flex" data-direction="column" data-mt="24" data-pb="24">
        {articles.map((article) => (
          <ArchiveArticle key={article.id} {...article} />
        ))}
      </ul>
    </main>
  );
}
