import type { MetaFunction } from "@remix-run/node";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { supabase } from "~/utils/supabase.server";
import { BookmarkFilters } from "~/components/BookmarkFilters";
import { BookmarkGrid } from "~/components/BookmarkGrid";
import { FolderList } from "~/components/FolderList";

export const meta: MetaFunction = () => {
  return [
    { title: "Bookmark Manager" },
    { name: "description", content: "Manage your bookmarks efficiently" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const sort = url.searchParams.get("sort") || "newest";
  const tag = url.searchParams.get("tag");
  const folder = url.searchParams.get("folder");
  
  let query_builder = supabase
    .from("bookmarks")
    .select(`
      *,
      folder:folders(name),
      tags:bookmark_tags(tag:tags(name))
    `)
    .eq("user_id", user.id);

  // Apply folder filter
  if (folder) {
    query_builder = query_builder.eq("folder_id", folder);
  }

  // Apply search filter
  if (query) {
    query_builder = query_builder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Apply tag filter
  if (tag) {
    query_builder = query_builder
      .eq("tags.tag.name", tag);
  }

  // Apply sorting
  switch (sort) {
    case "oldest":
      query_builder = query_builder.order("created_at", { ascending: true });
      break;
    case "title":
      query_builder = query_builder.order("title", { ascending: true });
      break;
    default: // newest
      query_builder = query_builder.order("created_at", { ascending: false });
  }

  const { data: bookmarks } = await query_builder;

  // Get all unique tags for the filter dropdown
  const { data: tags } = await supabase
    .from("tags")
    .select("name")
    .eq("user_id", user.id)
    .order("name");

  // Get folders with bookmark counts
  const { data: folders } = await supabase
    .from("folders")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  // Get bookmark counts per folder
  const { data: folderCounts } = await supabase
    .from("bookmarks")
    .select("folder_id")
    .eq("user_id", user.id);

  const activeCount = (folderCounts || []).reduce((acc, bookmark) => {
    const folderId = bookmark.folder_id || "uncategorized";
    acc[folderId] = (acc[folderId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return json({ bookmarks, tags, folders, activeCount });
}

export default function Index() {
  const { bookmarks, folders, activeCount } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FolderList folders={folders || []} activeCount={activeCount} />
        </div>
        <div className="flex-1">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </Form>
          </div>
          <div>
            <a
              href="/bookmarks/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add Bookmark
            </a>
          </div>
        </div>

        <BookmarkFilters />

        <BookmarkGrid bookmarks={bookmarks} />
        </div>
      </div>
    </div>
  );
}