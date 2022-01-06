import { h, render, ComponentChild } from "preact";
import { useState } from "preact/hooks";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "react-query";

const queryClient = new QueryClient();

type ArticleIdType = string;
type ArticleUrlType = string;
type ArticleStatusType = string;
type ArticleSourceType = string;

type ArticlePayloadType = { url: ArticleUrlType };

type ArticleType = {
  id: ArticleIdType;
  url: ArticleUrlType;
  status: ArticleStatusType;
  source: ArticleSourceType;
};

type NewspaperIdType = string;
type NewspaperStatusType = string;

type NewspaperType = {
  id: NewspaperIdType;
  status: NewspaperStatusType;
  number: string;
  sentAt: number;
  scheduledAt: number;
  articles: ArticleType[];
};

function Badge(props: { children: ComponentChild }) {
  return (
    <strong
      data-transform="uppercase"
      data-color="gray-600"
      data-bg="gray-200"
      data-px="6"
      data-br="4"
      data-ls="1"
      data-fs="12"
      {...props}
    />
  );
}
function Link(props: h.JSX.IntrinsicElements["a"]) {
  return (
    <a
      target="_blank"
      class="c-link"
      data-color="gray-700"
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      {...props}
    />
  );
}

function AddArticleForm() {
  const [url, setUrl] = useState<ArticleUrlType>("");

  const addArticleRequest = useMutation(
    async (article: ArticlePayloadType) =>
      fetch("/add-article", {
        method: "POST",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify(article),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["articles"]);
        setUrl("");
      },
    }
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        addArticleRequest.mutate({ url });
      }}
      data-mb="48"
    >
      <div data-display="flex" data-cross="end">
        <div
          data-display="flex"
          data-direction="column"
          data-mr="12"
          data-grow="1"
        >
          <label class="c-label" for="url" data-mb="6">
            Article URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            value={url}
            onInput={(event) => setUrl(event.currentTarget.value)}
            placeholder="https://example.com/blogpost"
            class="c-input"
            data-grow="1"
          />
        </div>
        <button class="c-button" data-variant="secondary" type="submit">
          Add
        </button>
      </div>
    </form>
  );
}

function ArticleList() {
  const articles = useQuery(
    ["articles"],
    async (): Promise<ArticleType[]> =>
      fetch("/articles", {
        method: "GET",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
      }).then((response) => (response.ok ? response.json() : [])),
    { initialData: [] }
  );

  const deleteArticle = useMutation(
    async (articleId: ArticleType["id"]) =>
      fetch(`/delete-article/${articleId}`, {
        method: "POST",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
      }),
    { onSuccess: () => queryClient.invalidateQueries(["articles"]) }
  );

  return (
    <section>
      <div data-bg="gray-100" data-bw="1" data-bc="gray-200" data-p="12">
        <h2
          data-fs="16"
          data-color="gray-800"
          data-fw="500"
          data-bw="2"
          data-bcb="gray-200"
          data-pb="6"
        >
          Articles
        </h2>

        <div data-display="flex" data-mt="24">
          <button
            id="select-all"
            type="button"
            class="c-button"
            data-variant="secondary"
            data-mr="12"
          >
            Select all
          </button>
          <button
            id="deselect-all"
            type="button"
            class="c-button"
            data-variant="secondary"
          >
            Deselect all
          </button>

          <form
            id="create-newspaper"
            method="POST"
            action="/create-newspaper"
            data-ml="auto"
          >
            <button type="submit" class="c-button" data-variant="primary">
              Create newspaper
            </button>
          </form>
        </div>
      </div>

      {articles.isSuccess && articles.data.length === 0 && (
        <small data-md-px="12" data-mt="12" data-ml="6">
          No articles added at the moment
        </small>
      )}

      <ul data-mt="24">
        {articles.isSuccess &&
          articles.data.map((article) => (
            <li
              data-display="flex"
              data-cross="center"
              data-wrap="nowrap"
              data-mb="24"
              data-md-px="6"
            >
              <input
                id="urls"
                name={article.id}
                class="c-checkbox"
                type="checkbox"
                data-mr="12"
              />
              <Link href={article.url} data-mr="12">
                {article.url}
              </Link>

              <Badge dat-ml="auto" data-mr="12">
                {article.status}
              </Badge>

              <Badge data-mr="12">{article.source}</Badge>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  deleteArticle.mutate(article.id);
                }}
              >
                <button type="submit" class="c-button" data-variant="bare">
                  Delete
                </button>
              </form>
            </li>
          ))}
      </ul>
    </section>
  );
}

function NewspaperList() {
  const newspapers = useQuery(
    ["newspapers"],
    async (): Promise<NewspaperType[]> =>
      fetch("/newspapers", {
        method: "GET",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
      }).then((response) => (response.ok ? response.json() : [])),
    { initialData: [] }
  );

  const archiveNewspaper = useMutation(
    async (newspaperId: NewspaperType["id"]) =>
      fetch(`/archive-newspaper/${newspaperId}`, {
        method: "POST",
        mode: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
      }),
    { onSuccess: () => queryClient.invalidateQueries(["newspapers"]) }
  );

  return (
    <section data-mt="48">
      <div
        data-display="flex"
        data-cross="center"
        data-bg="gray-100"
        data-bw="1"
        data-bc="gray-200"
        data-p="12"
      >
        <h2 data-fs="16" data-color="gray-800" data-fw="500">
          Newspapers
        </h2>
      </div>

      {newspapers.isSuccess && newspapers.data.length === 0 && (
        <small data-md-px="12" data-mt="12" data-ml="6">
          No newspapers added at the moment
        </small>
      )}

      <ul data-mt="24">
        {newspapers.isSuccess &&
          newspapers.data.map((newspaper) => (
            <li data-display="flex" data-direction="column" data-mb="24">
              <div data-display="flex" data-cross="center">
                <Badge>{newspaper.status}</Badge>
                <span data-ml="12">Newspaper #{newspaper.number}</span>

                <div data-ml="auto">
                  {newspaper.status === "delivered" && (
                    <span data-fs="14" data-color="gray-400" data-mr="6">
                      Sent at {new Date(newspaper.sentAt).toLocaleString()}
                    </span>
                  )}

                  <button
                    data-status="visible"
                    class="c-button"
                    data-variant="bare"
                  >
                    <img
                      height="16"
                      width="16"
                      src="/arrow-down-icon.svg"
                      alt=""
                    />
                  </button>

                  <button
                    data-status="hidden"
                    class="c-button"
                    data-variant="bare"
                  >
                    <img
                      height="16"
                      width="16"
                      src="/arrow-up-icon.svg"
                      alt=""
                    />
                  </button>
                </div>
              </div>

              <div>
                <div data-display="flex" data-mt="12" data-mb="24">
                  {newspaper.status === "delivered" && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        archiveNewspaper.mutate(newspaper.id);
                      }}
                      data-mr="24"
                    >
                      <button
                        type="submit"
                        class="c-button"
                        data-variant="secondary"
                      >
                        Archive
                      </button>
                    </form>
                  )}

                  {["delivered", "error"].includes(newspaper.status) && (
                    <form
                      method="POST"
                      action={`/resend-newspaper/${newspaper.id}`}
                    >
                      <button
                        type="submit"
                        class="c-button"
                        data-variant="primary"
                      >
                        Resend
                      </button>
                    </form>
                  )}

                  <span
                    data-fs="14"
                    data-color="gray-400"
                    data-ml="auto"
                    data-mr="6"
                  >
                    Scheduled at{" "}
                    {new Date(newspaper.scheduledAt).toLocaleString()}
                  </span>
                </div>

                <ol data-mt="6" data-mb="12">
                  {newspaper.articles.map((article) => (
                    <li
                      data-display="flex"
                      data-wrap="nowrap"
                      data-mb="12"
                      data-max-width="768"
                    >
                      <Link href={article.url} data-pr="12">
                        {article.url}
                      </Link>

                      <Badge data-ml="auto" data-mr="12">
                        {article.source}
                      </Badge>
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AddArticleForm />
      <ArticleList />
      <NewspaperList />
    </QueryClientProvider>
  );
}

render(<App />, document.querySelector("#root") as Element);
