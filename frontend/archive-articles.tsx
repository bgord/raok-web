import { RoutableProps } from "preact-router";
import { h } from "preact";
import { useQuery } from "react-query";
import { useUrlFilter, useClientSearch } from "@bgord/frontend";
import { Search } from "iconoir-react";

import * as UI from "./ui";
import * as Icons from "./icons";
import * as api from "./api";
import * as types from "./types";
import { TimestampFiltersEnum } from "./filters";
import { ArchiveArticle } from "./archive-article";

export type InitialArchiveArticlesDataType = {
  archiveArticles: types.ArchiveArticleType[];
};

export function ArchiveArticles(props: RoutableProps) {
  const search = useClientSearch();

  const sourceFilter = useUrlFilter({
    enum: types.ArticleSourceEnum,
    label: "source",
  });

  const statusFilter = useUrlFilter({
    enum: types.ArticleStatusEnum,
    label: "status",
  });

  const createdAt = useUrlFilter({
    enum: TimestampFiltersEnum,
    defaultQuery: TimestampFiltersEnum.last_3_days,
    label: "createdAt",
  });

  const filters = {
    status: statusFilter.query,
    source: sourceFilter.query,
    createdAt: createdAt.query,
  };

  const archiveArticles = useQuery(["archive-articles", filters], () =>
    api.getArchiveArticles(filters)
  );

  const articles = (archiveArticles.data ?? []).filter((article) =>
    search.filterFn(String(article.title))
  );

  const numberOfArticles = articles.length;

  return (
    <main
      data-display="flex"
      data-direction="column"
      data-mt="24"
      data-mx="auto"
      data-md-pl="6"
      data-md-pr="3"
      data-max-width="768"
      data-md-max-width="100%"
      data-width="100%"
    >
      <div data-display="flex" data-cross="center">
        <h2 data-fs="20" data-color="gray-800" data-fw="500">
          Archive Articles
        </h2>

        <UI.Badge data-ml="12">{numberOfArticles}</UI.Badge>
      </div>

      <div data-display="flex" data-cross="end" data-mt="12">
        <div
          data-display="flex"
          data-direction="column"
          data-mt="12"
          data-mr="24"
        >
          <label class="c-label" for="created-at">
            Created at
          </label>
          <UI.Select
            id="created-at"
            name="created-at"
            value={createdAt.query}
            onInput={createdAt.onChange}
          >
            {createdAt.options.map((option) => (
              <option value={option}>{option}</option>
            ))}
          </UI.Select>
        </div>

        <div
          data-display="flex"
          data-direction="column"
          data-mt="12"
          data-mr="24"
        >
          <label class="c-label" for="status">
            Status
          </label>
          <UI.Select
            id="status"
            name="status"
            value={statusFilter.query}
            onInput={statusFilter.onChange}
          >
            <option selected>All</option>

            {statusFilter.options.map((status) => (
              <option value={status}>{status}</option>
            ))}
          </UI.Select>
        </div>

        <div
          data-display="flex"
          data-direction="column"
          data-mt="12"
          data-mr="24"
        >
          <label class="c-label" for="source">
            Source
          </label>
          <UI.Select
            id="source"
            name="source"
            class="c-select"
            value={sourceFilter.query}
            onInput={sourceFilter.onChange}
          >
            <option selected>All</option>

            {sourceFilter.options.map((source) => (
              <option value={source}>{source}</option>
            ))}
          </UI.Select>
        </div>

        <button
          type="button"
          class="c-button"
          data-variant="bare"
          onClick={() => {
            createdAt.clear();
            statusFilter.clear();
            sourceFilter.clear();
          }}
        >
          Reset filters
        </button>
      </div>

      <div data-display="flex" data-my="24" data-max-width="100%">
        <div data-position="relative">
          <input
            list="articles"
            onInput={search.onChange}
            value={search.query}
            class="c-input"
            placeholder="Search for an article..."
            style="padding-right: 36px"
            data-width="100%"
          />
          <Search
            height="34"
            width="34"
            data-position="absolute"
            data-p="6"
            style="top: 1px; right: 1px; background: white;"
          />
        </div>

        <button
          type="button"
          onClick={search.clear}
          class="c-button"
          data-variant="bare"
          data-px="3"
          data-ml="6"
          data-mr="auto"
        >
          <Icons.Close />
        </button>
      </div>

      {archiveArticles.isSuccess && archiveArticles.data.length === 0 && (
        <div data-fs="14" data-color="gray-700">
          No archive articles.
        </div>
      )}

      <datalist id="articles">
        {archiveArticles.data?.map((article) => (
          <option value={String(article.title)} />
        ))}
      </datalist>

      <ul data-display="flex" data-direction="column" data-max-width="100%">
        {articles.map((article) => (
          <ArchiveArticle key={article.id} {...article} />
        ))}
      </ul>
    </main>
  );
}
