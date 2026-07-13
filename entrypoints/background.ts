import { toAppError } from "../lib/errors";
import { fetchPortfolioPage } from "../lib/portfolio-import";
import {
  backgroundPingMessageSchema,
  backgroundPongResponseSchema,
  importPortfolioErrorSchema,
  importPortfolioMessageSchema,
  importPortfolioSuccessSchema,
} from "../lib/schemas";

export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const ping = backgroundPingMessageSchema.safeParse(message);

    if (ping.success) {
      sendResponse(
        backgroundPongResponseSchema.parse({
          type: "pong",
          ok: true,
        }),
      );
      return true;
    }

    const importMessage = importPortfolioMessageSchema.safeParse(message);

    if (!importMessage.success) {
      return false;
    }

    void (async () => {
      try {
        const text = await fetchPortfolioPage(importMessage.data.url);
        sendResponse(
          importPortfolioSuccessSchema.parse({
            type: "import_portfolio_result",
            ok: true,
            text,
          }),
        );
      } catch (error) {
        const appError = toAppError(error);
        sendResponse(
          importPortfolioErrorSchema.parse({
            type: "import_portfolio_result",
            ok: false,
            error: appError,
          }),
        );
      }
    })();

    return true;
  });
});
