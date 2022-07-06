import Router from "preact-router";
import { h } from "preact";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  ToastsContextProvider,
  TranslationsContextProvider,
} from "@bgord/frontend";
import type { Schema, TranslationsType } from "@bgord/node";

import { Toasts } from "./toasts";
import { Navigation } from "./navigation";
import { BuildMetaDataType } from "./build-meta";

import { Dashboard, InitialDashboardDataType } from "./dashboard";
import {
  ArchiveArticles,
  InitialArchiveArticlesDataType,
} from "./archive-articles";
import {
  ArchiveNewspapers,
  InitialArchiveNewspapersDataType,
} from "./archive-newspapers";
import { Settings, InitialSettingsDataType } from "./settings";
import { Review } from "./review";

export type InitialDataType = InitialDashboardDataType &
  InitialArchiveArticlesDataType &
  InitialArchiveNewspapersDataType &
  InitialSettingsDataType &
  BuildMetaDataType & {
    url: string;
    language: Schema.LanguageType;
    translations: TranslationsType;
  };

const queryClient = new QueryClient();

export function App(props: InitialDataType) {
  const {
    archiveArticles,
    archiveNewspapers,
    settings,
    BUILD_DATE,
    BUILD_VERSION,
    language,
    translations,
    ...rest
  } = props;

  queryClient.setQueryData("stats", props.stats);

  return (
    <QueryClientProvider client={queryClient}>
      <TranslationsContextProvider translations={translations}>
        <ToastsContextProvider>
          <Navigation />

          <Router url={props.url}>
            <ArchiveArticles
              path="/archive/articles"
              archiveArticles={archiveArticles}
            />
            <ArchiveNewspapers
              path="/archive/newspapers"
              archiveNewspapers={archiveNewspapers}
            />
            <Dashboard path="/dashboard" {...rest} />
            <Settings path="/settings" settings={settings} />
            <Review path="/review" articles={rest.articles} />
          </Router>

          <Toasts />
        </ToastsContextProvider>
      </TranslationsContextProvider>
    </QueryClientProvider>
  );
}
