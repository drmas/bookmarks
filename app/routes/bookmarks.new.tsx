import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { supabase } from "~/utils/supabase.server";
import { fetchMetadata } from "~/utils/metadata.server"; 
import { generateSummary } from "~/utils/groq.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  
  const url = formData.get("url") as string;

  if (!url) {
    return json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const metadata = await fetchMetadata(url);

    // Generate summary from metadata
    const content = metadata.description || metadata.title;
    let summary = null;
    
    if (content) {
      try {
        const summaryResult = await generateSummary(content, 150, 'auto');
        summary = summaryResult.summary;
      } catch (summaryError) {
        console.error('Summary generation failed:', summaryError);
        // Continue without summary if generation fails
      }
    }

    const { data: bookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .insert([
        {
          title: metadata.title,
          url,
          description: metadata.description,
          favicon: metadata.favicon,
          summary,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (bookmarkError) throw bookmarkError;

    return redirect("/");
  } catch (error) {
    return json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export default function NewBookmark() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Bookmark</h1>
          
          <Form method="post" className="space-y-4">
            {actionData?.error && (
              <div className="text-red-600 text-sm mb-4">{actionData.error}</div>
            )}

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                placeholder="https://example.com"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <p className="text-sm text-gray-500">
              Enter a URL and we'll automatically fetch the title, description, and favicon.
            </p>

            <div className="flex justify-end gap-4">
              <a
                href="/"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}