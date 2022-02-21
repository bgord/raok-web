import { h } from "preact";
import { useQueryClient, useQuery, useMutation } from "react-query";
import * as bg from "@bgord/frontend";

import * as api from "./api";
import * as UI from "./ui";
import { ArticleType, NewspaperType } from "./types";

export function FavouriteArticles(props: { initialData: ArticleType[] }) {
  const _articles = useQuery(
    ["favourite-articles"],
    api.getFavouriteArticles,
    props
  );

  const list = bg.useExpandableList({
    max: 5,
    length: _articles.data?.length ?? 0,
  });

  const favouriteArticles = _articles.data ?? [];
  const articles = bg.useAnimaList(favouriteArticles, "tail");

  const deleteArticleFromFavourites = useDeleteArticleFromFavourites();

  return (
    <div data-bg="gray-100" data-p="12" data-bw="4" data-bct="gray-200">
      <UI.Header data-display="flex" data-mb="24">
        <img
          loading="eager"
          height="20"
          width="20"
          src="/icon-star.svg"
          alt=""
          data-mr="12"
        />
        Favourite articles
      </UI.Header>

      {articles.count === 0 && (
        <small data-fs="14" data-color="gray-600">
          Your favourite sent articles will appear here
        </small>
      )}

      <bg.AnimaList>
        {articles.items.filter(list.filterFn).map((article) => (
          <bg.Anima effect="opacity" {...article.props}>
            <li
              key={article.item.id}
              data-display="flex"
              data-cross="center"
              data-overflow="hidden"
              data-wrap="nowrap"
              data-mb="6"
            >
              <UI.OutboundLink href={article.item.url} data-fs="14">
                {article.item.title || article.item.url}
              </UI.OutboundLink>

              <form
                data-ml="auto"
                onSubmit={(event) => {
                  event.preventDefault();
                  deleteArticleFromFavourites.mutate(article.item.id);
                }}
              >
                <button
                  disabled={deleteArticleFromFavourites.isLoading}
                  type="submit"
                  class="c-button"
                  data-variant="bare"
                  data-ml="12"
                >
                  Remove
                </button>
              </form>
            </li>
          </bg.Anima>
        ))}
      </bg.AnimaList>

      {list.displayShowMore && (
        <button
          type="button"
          class="c-button"
          data-variant="bare"
          data-px="0"
          onClick={list.showMore}
        >
          Show {list.numberOfExcessiveElements} more
        </button>
      )}

      {list.displayShowLess && (
        <button
          type="button"
          class="c-button"
          data-variant="bare"
          onClick={list.showLess}
        >
          Show less
        </button>
      )}
    </div>
  );
}

function useDeleteArticleFromFavourites() {
  const queryClient = useQueryClient();
  const notify = bg.useToastTrigger();

  return useMutation(api.deleteArticleFromFavourites, {
    onSuccess: (_response, articleId) => {
      notify({ message: "Deleted from favourites" });

      queryClient.invalidateQueries(["favourite-articles"]);

      queryClient.setQueryData<NewspaperType[]>(
        "newspapers",
        (newspapers = []) =>
          newspapers.map((newspaper) => ({
            ...newspaper,
            articles: newspaper.articles.map((article) => {
              if (article.id === articleId) {
                article.favourite = false;
              }
              return article;
            }),
          }))
      );
    },
  });
}
