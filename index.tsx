import express from "express";
import * as bg from "@bgord/node";

import * as Routes from "./routes";

import { Scheduler } from "./jobs";
import { ErrorHandler } from "./error-handler";
import { Env } from "./env";

const app = express();

bg.addExpressEssentials(app, { helmet: { contentSecurityPolicy: false } });
bg.Handlebars.applyTo(app);
bg.Language.applyTo(app, "translations");

const session = new bg.Session({
  secret: Env.COOKIE_SECRET,
  store: bg.SessionFileStore.build({ ttl: 60 * 60 * 24 * 3 /* 3 days */ }),
});
session.applyTo(app);

const AuthShield = new bg.EnvUserAuthShield({
  ADMIN_USERNAME: Env.ADMIN_USERNAME,
  ADMIN_PASSWORD: Env.ADMIN_PASSWORD,
});
AuthShield.applyTo(app);

app.get("/", bg.CsrfShield.attach, bg.Route(Routes.Home));

app.get("/articles", AuthShield.verify, bg.Route(Routes.Articles));
app.get(
  "/articles/favourite",
  AuthShield.verify,
  bg.Route(Routes.FavouriteArticles)
);
app.get(
  "/articles/archive",
  AuthShield.verify,
  bg.Route(Routes.ArchiveArticles)
);

app.post("/add-article", AuthShield.verify, bg.Route(Routes.AddArticle));
app.post(
  "/delete-article/:articleId",
  AuthShield.verify,
  bg.Route(Routes.DeleteArticle)
);
app.post(
  "/undelete-article/:articleId",
  AuthShield.verify,
  bg.Route(Routes.UndeleteArticle)
);
app.post(
  "/articles/old/delete",
  AuthShield.verify,
  bg.Route(Routes.DeleteOldArticles)
);
app.post(
  "/article/:articleId/favourite",
  AuthShield.verify,
  bg.Route(Routes.AddArticleToFavourites)
);
app.post(
  "/article/:articleId/unfavourite",
  AuthShield.verify,
  bg.Route(Routes.DeleteArticleFromFavourites)
);

app.get("/newspapers", AuthShield.verify, bg.Route(Routes.Newspapers));
app.get(
  "/newspapers/archive",
  AuthShield.verify,
  bg.Route(Routes.ArchiveNewspapers)
);
app.get(
  "/newspaper/:newspaperId",
  AuthShield.verify,
  bg.Route(Routes.SingleNewspaper)
);
app.get(
  "/newspaper/:newspaperId/read",
  AuthShield.verify,
  bg.Route(Routes.NewspaperRead)
);
app.post(
  "/create-newspaper",
  AuthShield.verify,
  bg.Route(Routes.CreateNewspaper)
);
app.post(
  "/archive-newspaper/:newspaperId",
  AuthShield.verify,
  bg.Route(Routes.ArchiveNewspaper)
);
app.post(
  "/cancel-newspaper/:newspaperId",
  AuthShield.verify,
  bg.Route(Routes.CancelNewspaper)
);
app.post(
  "/resend-newspaper/:newspaperId",
  AuthShield.verify,
  bg.Route(Routes.ResendNewspaper)
);

app.post(
  "/send-arbitrary-file",
  AuthShield.verify,
  ...new bg.FileUploader({
    autoClean: false,
    maxFilesSize: 5_000_000, // 5 MB
  }).handle(),
  bg.Route(Routes.SendArbitraryFile)
);

app.get("/stats", AuthShield.verify, bg.Route(Routes.Stats));
app.get("/settings", AuthShield.verify, bg.Route(Routes.Dashboard));
app.get("/account/settings", AuthShield.verify, bg.Route(Routes.Settings));

app.post(
  "/disable-articles-to-review-notification",
  AuthShield.verify,
  bg.Route(Routes.DisableArticlesToReviewNotification)
);
app.post(
  "/enable-articles-to-review-notification",
  AuthShield.verify,
  bg.Route(Routes.EnableArticlesToReviewNotification)
);
app.post(
  "/set-articles-to-review-notification-hour",
  AuthShield.verify,
  bg.Route(Routes.SetArticlesToReviewNotificationHour)
);

app.get(
  "/archive/articles",
  AuthShield.verify,
  bg.Route(Routes.ArticlesArchive)
);
app.get(
  "/archive/newspapers",
  AuthShield.verify,
  bg.Route(Routes.NewspapersArchive)
);

app.post(
  "/schedule-feedly-articles-crawl",
  AuthShield.verify,
  bg.Route(Routes.ScheduleFeedlyArticlesCrawl)
);

app.get("/review", AuthShield.verify, bg.Route(Routes.Review));

app.post(
  "/login",
  bg.CsrfShield.verify,
  AuthShield.attach,
  (_request, response) => response.redirect("/dashboard")
);
app.get("/logout", AuthShield.detach, (request, response) =>
  response.redirect("/")
);

app.get("/dashboard", AuthShield.verify, bg.Route(Routes.Dashboard));

app.get("/test", bg.Route(Routes.Test));

app.get("*", (_, response) => response.redirect("/"));
app.use(ErrorHandler.handle);

const server = app.listen(Env.PORT, () =>
  bg.Reporter.info(`Server running on port: ${Env.PORT}`)
);

bg.GracefulShutdown.applyTo(server, () => {
  bg.Reporter.info("Shutting down job scheduler");
  Scheduler.stop();
});
