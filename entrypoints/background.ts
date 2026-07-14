import { generateLetter } from "../lib/api/deepseek";
import { getDeepSeekApiKey } from "../lib/deepseek-config";
import { fetchHhVacancy, fetchHhVacancyFromWebsite, fetchHhVacancyViaTab } from "../lib/api/hh";
import { toAppError } from "../lib/errors";
import { fetchPortfolioPage } from "../lib/portfolio-import";
import { buildGenerationRequest } from "../lib/prompts";
import {
  backgroundPingMessageSchema,
  backgroundPongResponseSchema,
  fetchVacancyErrorSchema,
  fetchVacancyMessageSchema,
  fetchVacancySuccessSchema,
  generateLetterErrorSchema,
  generateLetterMessageSchema,
  generateLetterSuccessSchema,
  cancelGenerateLetterMessageSchema,
  cancelGenerateLetterResponseSchema,
  importPortfolioErrorSchema,
  importPortfolioMessageSchema,
  importPortfolioSuccessSchema,
} from "../lib/schemas";

let activeGenerationAbort: AbortController | null = null;

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

    if (importMessage.success) {
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
    }

    const fetchVacancyMessage = fetchVacancyMessageSchema.safeParse(message);

    if (fetchVacancyMessage.success) {
      void (async () => {
        try {
          const { vacancyId, sourceUrl, tabId } = fetchVacancyMessage.data;
          let vacancy;

          if (tabId != null) {
            try {
              vacancy = await fetchHhVacancyViaTab(tabId, vacancyId, sourceUrl);
            } catch (tabError) {
              try {
                vacancy = await fetchHhVacancyFromWebsite(vacancyId, sourceUrl);
              } catch {
                throw tabError;
              }
            }
          } else {
            vacancy = await fetchHhVacancy(vacancyId, sourceUrl);
          }

          sendResponse(
            fetchVacancySuccessSchema.parse({
              type: "fetch_vacancy_result",
              ok: true,
              vacancy,
            }),
          );
        } catch (error) {
          const appError = toAppError(error);
          sendResponse(
            fetchVacancyErrorSchema.parse({
              type: "fetch_vacancy_result",
              ok: false,
              error: appError,
            }),
          );
        }
      })();

      return true;
    }

    const generateLetterMessage = generateLetterMessageSchema.safeParse(message);

    if (generateLetterMessage.success) {
      void (async () => {
        activeGenerationAbort?.abort();
        const abortController = new AbortController();
        activeGenerationAbort = abortController;

        try {
          const { profile, vacancy, settings } = generateLetterMessage.data;
          const request = buildGenerationRequest(profile, vacancy, settings);
          const result = await generateLetter(
            getDeepSeekApiKey(),
            request,
            settings.length,
            settings.format,
            {
              signal: abortController.signal,
            },
          );
          sendResponse(
            generateLetterSuccessSchema.parse({
              type: "generate_letter_result",
              ok: true,
              result,
            }),
          );
        } catch (error) {
          const appError = toAppError(error);
          sendResponse(
            generateLetterErrorSchema.parse({
              type: "generate_letter_result",
              ok: false,
              error: appError,
            }),
          );
        } finally {
          if (activeGenerationAbort === abortController) {
            activeGenerationAbort = null;
          }
        }
      })();

      return true;
    }

    const cancelGenerateLetterMessage = cancelGenerateLetterMessageSchema.safeParse(message);

    if (cancelGenerateLetterMessage.success) {
      activeGenerationAbort?.abort();
      sendResponse(
        cancelGenerateLetterResponseSchema.parse({
          type: "cancel_generate_letter_result",
          ok: true,
        }),
      );
      return true;
    }

    return false;
  });
});
