import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";
import { supabase } from "~/utils/supabase.server";
import { generateSummary } from "~/utils/groq.server";
import { fetchMetadata } from "~/utils/metadata.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

  // Get the bookmark
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("url, id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (bookmarkError || !bookmark) {
    return json({ error: "Bookmark not found" }, { status: 404 });
  }

  try {
    // Fetch the content
    const metadata = await fetchMetadata(bookmark.url);
    const content = metadata.description || metadata.title;

    if (!content) {
      throw new Error("No content available to summarize");
    }

    // Generate summary
    const { summary } = await generateSummary(content);

    // Update the bookmark with the summary
    const { error: updateError } = await supabase
      .from("bookmarks")
      .update({ summary })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return json({ summary });
  } catch (error) {
    return json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}