import { backgroundPingMessageSchema, backgroundPongResponseSchema } from "../lib/schemas";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const parsed = backgroundPingMessageSchema.safeParse(message);

    if (!parsed.success) {
      return false;
    }

    const response = backgroundPongResponseSchema.parse({
      type: "pong",
      ok: true,
    });

    sendResponse(response);
    return true;
  });
});
