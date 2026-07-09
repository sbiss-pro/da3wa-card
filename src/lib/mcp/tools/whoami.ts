import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "whoami",
  title: "من أنا",
  description: "Return the signed-in INVITLY user id and email for the current MCP session.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const email = ctx.getUserEmail();
    return {
      content: [{ type: "text", text: `user_id=${userId} email=${email ?? "(unknown)"}` }],
      structuredContent: { userId, email: email ?? null },
    };
  },
});
