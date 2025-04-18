import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

// Adresy URL, które nie wymagają uwierzytelnienia
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/reset-redirect",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  "/",
];

export const onRequest = defineMiddleware(async ({ request, locals, redirect }, next) => {
  // Dodaj klienta Supabase do kontekstu żądania
  locals.supabase = supabaseClient;

  // Sprawdź, czy ścieżka jest publiczna
  const url = new URL(request.url);
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path);

  // Jeśli to nie jest ścieżka publiczna, sprawdź sesję
  if (!isPublicPath) {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
      // Jeśli brak sesji, przekieruj do strony logowania
      return redirect("/auth/login");
    }
  }

  // Kontynuuj obsługę żądania
  return next();
});
