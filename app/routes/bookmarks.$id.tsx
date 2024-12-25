import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useRouteError, isRouteErrorResponse, useFetcher } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { supabase } from "~/utils/supabase.server";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bookmark not found</h1>
            <p className="text-gray-600 mb-6">
              The bookmark you're looking for doesn't exist or has been deleted.
            </p>
            <a
              href="/"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Back to Bookmarks
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred. Please try again later.
          </p>
          <a
            href="/"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Back to Bookmarks
          </a>
        </div>
      </div>
    </div>
  );
}
export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .select(`
      *,
      tags:bookmark_tags(tag:tags(name)),
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !bookmark) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ bookmark });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    return redirect("/");
  }

  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const description = formData.get("description") as string;
  const summary = formData.get("summary") as string;
  const tags = (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean);

  if (!title || !url) {
    return json({ error: "Title and URL are required" }, { status: 400 });
  }

  try {
    // Update bookmark
    const { error: bookmarkError } = await supabase
      .from("bookmarks")
      .update({ title, url, description, summary })
      .eq("id", id)
      .eq("user_id", user.id);

    if (bookmarkError) throw bookmarkError;

    // Delete existing tags
    await supabase
      .from("bookmark_tags")
      .delete()
      .eq("bookmark_id", id);

    if (tags.length > 0) {
      // Create or get existing tags
      const { data: existingTags } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags)
        .eq("user_id", user.id);

      const existingTagNames = existingTags?.map(t => t.name) || [];
      const newTags = tags.filter(t => !existingTagNames.includes(t));

      if (newTags.length > 0) {
        const { data: createdTags, error: tagError } = await supabase
          .from("tags")
          .insert(newTags.map(name => ({ name, user_id: user.id })))
          .select();

        if (tagError) throw tagError;

        const allTags = [...(existingTags || []), ...(createdTags || [])];
        
        // Create bookmark_tags associations
        const { error: bookmarkTagError } = await supabase
          .from("bookmark_tags")
          .insert(
            allTags.map(tag => ({
              bookmark_id: id,
              tag_id: tag.id,
            }))
          );

        if (bookmarkTagError) throw bookmarkTagError;
      }
    }

    return redirect("/");
  } catch (error) {
    return json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export default function EditBookmark() {
  const { bookmark } = useLoaderData<typeof loader>();
  const summaryFetcher = useFetcher<{ error?: string }>();
  const ttsFetcher = useFetcher<{ audioUrl?: string; error?: string }>();
  const existingTags = bookmark.tags?.map(({ tag }: { tag: { name: string } }) => tag?.name).filter(Boolean).join(", ");
  const isSummaryGenerating = summaryFetcher.state === "submitting";
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleSpeech = () => {
    if (!bookmark.summary) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioUrl) {
      ttsFetcher.submit(
        {},
        {
          method: "post",
          action: `/bookmarks/${bookmark.id}/text-to-speech`,
        }
      );
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (ttsFetcher.data?.audioUrl) {
      setAudioUrl(ttsFetcher.data.audioUrl);
      if (audioRef.current) {
        audioRef.current.src = ttsFetcher.data.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [ttsFetcher.data]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Preview Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <div>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">{bookmark.title}</h1>
                <svg 
                  className="ml-2 h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Created {formatDistanceToNow(new Date(bookmark.created_at))} ago</span>
                <span>•</span>
                <span>Updated {formatDistanceToNow(new Date(bookmark.updated_at))} ago</span>
              </div>
            </div>
          </div>
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {bookmark.tags.map(({ tag }: { tag: { name: string } }, index: number) => (
                  tag?.name && (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag.name}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {bookmark.description && (
            <div className="prose max-w-none mb-4">
              <p className="text-gray-700">{bookmark.description}</p>
            </div>
          )}

          {bookmark.summary && (
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">AI Summary</h3>
                <button
                  type="button"
                  onClick={toggleSpeech}
                  disabled={ttsFetcher.state === "submitting"}
                  className="inline-flex items-center px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isPlaying ? "Stop" : "Play summary"}
                >
                  {ttsFetcher.state === "submitting" ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : isPlaying ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600">{bookmark.summary}</p>
              {ttsFetcher.data?.error && (
                <p className="mt-2 text-sm text-red-600">{ttsFetcher.data.error}</p>
              )}
              <audio ref={audioRef} className="hidden">
                <track kind="captions" src="" label="English" />
              </audio>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Details</h2>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
          
          <Form method="post" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={bookmark.title}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  defaultValue={bookmark.url}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={bookmark.description || ""}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                    Link Summary
                  </label>
                  <button
                    type="button"
                    disabled={isSummaryGenerating}
                    onClick={() => {
                      summaryFetcher.submit(
                        {},
                        {
                          method: "post",
                          action: `/bookmarks/${bookmark.id}/generate-summary`,
                        }
                      );
                    }}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSummaryGenerating ? 'Generating...' : 'Generate Summary'}
                  </button>
                </div>
                <div className="mt-1">
                  <textarea
                    id="summary"
                    name="summary"
                    defaultValue={bookmark.summary || ""}
                    rows={4}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      isSummaryGenerating ? 'opacity-50' : ''
                    }`}
                    placeholder="AI-generated summary will appear here..."
                    readOnly
                  />
                </div>
                {summaryFetcher.data?.error && (
                  <p className="mt-1 text-sm text-red-600">
                    {summaryFetcher.data.error}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Click &quot;Generate Summary&quot; to create an AI-powered summary of the linked content.
                </p>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  defaultValue={existingTags}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="tech, reading, tutorial"
                />
              </div>
            </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Delete Bookmark
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this bookmark? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Form method="post">
                    <button
                      type="submit"
                      name="intent"
                      value="delete"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    >
                      Delete
                    </button>
                  </Form>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}