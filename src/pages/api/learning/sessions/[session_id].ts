import type { APIContext } from "astro";
import { createNotFoundError, createServerError, createUnauthorizedError } from "@/lib/errors";
import { sessionIdParamSchema } from "@/lib/validation/schemas";
import { endLearningSession, getSessionSummary } from "@/lib/services/learning.service";
import type { EndLearningSessionResponseDto } from "@/types";

export const prerender = false;

/**
 * Get session summary (GET)
 * Endpoint to retrieve information about a learning session
 */
export async function GET({ params, locals }: APIContext): Promise<Response> {
  // Get Supabase client from context
  const supabase = locals.supabase;

  // Get user from session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createUnauthorizedError();
  }

  try {
    // Validate session_id parameter
    const result = sessionIdParamSchema.safeParse(params);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid session ID",
          errors: result.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { session_id } = result.data;

    try {
      // Get the session summary
      const summary = await getSessionSummary(supabase, user.id, session_id);

      return new Response(JSON.stringify({ session_summary: summary }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      // Handle specific errors
      if (error instanceof Error && error.message?.includes("Session not found")) {
        return createNotFoundError("Learning session not found");
      }

      // Handle other errors
      console.error("Error getting learning session:", error);
      return createServerError("Failed to get learning session");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return createServerError("An unexpected error occurred");
  }
}

/**
 * End a learning session (PUT)
 * Endpoint to mark a learning session as completed and calculate summary statistics
 */
export async function PUT({ params, locals }: APIContext): Promise<Response> {
  // Get Supabase client from context
  const supabase = locals.supabase;

  // Get user from session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createUnauthorizedError();
  }

  try {
    // Validate session_id parameter
    const result = sessionIdParamSchema.safeParse(params);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid session ID",
          errors: result.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { session_id } = result.data;

    try {
      // End the learning session and get summary
      const response: EndLearningSessionResponseDto = await endLearningSession(supabase, user.id, session_id);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      // Handle specific errors
      if (error instanceof Error && error.message?.includes("Session not found")) {
        return createNotFoundError("Learning session not found");
      }

      // Handle other errors
      console.error("Error ending learning session:", error);
      return createServerError("Failed to end learning session");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return createServerError("An unexpected error occurred");
  }
}
