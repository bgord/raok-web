import { h } from "preact";
import { useMutation, useQueryClient } from "react-query";
import { useToastTrigger } from "@bgord/frontend";

import * as api from "./api";

export function ScheduleFeedlyCrawlButton(
  props: h.JSX.IntrinsicElements["button"]
) {
  const queryClient = useQueryClient();
  const notify = useToastTrigger();

  const scheduleFeedlyArticlesCrawl = useMutation(
    api.scheduleFeedlyArticlesCrawl,
    {
      onSuccess() {
        setTimeout(scheduleFeedlyArticlesCrawl.reset, 5000);
        notify({ message: "Feedly crawl scheduled" });
        queryClient.invalidateQueries("stats");
      },
    }
  );

  return (
    <button
      type="button"
      onClick={() => scheduleFeedlyArticlesCrawl.mutate()}
      disabled={
        scheduleFeedlyArticlesCrawl.isLoading ||
        scheduleFeedlyArticlesCrawl.isSuccess
      }
      class="c-button"
      data-variant="bare"
      {...props}
    >
      {scheduleFeedlyArticlesCrawl.isIdle && "Schedule Feedly crawl"}
      {scheduleFeedlyArticlesCrawl.isLoading && "Scheduling..."}
      {scheduleFeedlyArticlesCrawl.isSuccess && "Scheduled!"}
      {scheduleFeedlyArticlesCrawl.isError && "Couldn't schedule"}
    </button>
  );
}
