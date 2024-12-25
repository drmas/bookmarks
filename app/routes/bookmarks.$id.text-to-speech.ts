import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import { supabase } from "~/utils/supabase.server";
import { textToSpeech } from "~/utils/elevenlabs.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

  // Get the bookmark
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("summary")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (bookmarkError || !bookmark) {
    return json({ error: "Bookmark not found" }, { status: 404 });
  }

  if (!bookmark.summary) {
    return json({ error: "No summary available" }, { status: 400 });
  }

  try {
    const { audioUrl } = await textToSpeech(bookmark.summary);
    return json({ audioUrl });
  } catch (error) {
    return json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 