import { Form, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react";
import { useCallback, useEffect } from "react";
import type { loader } from "~/routes/_index";

export function BookmarkFilters() {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const { tags } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const isSearching = navigation.state === "submitting" || 
                     navigation.state === "loading";

  const handleChange = useCallback((event: React.ChangeEvent<HTMLFormElement>) => {
    submit(event.currentTarget);
  }, [submit]);

  // Debounce search input
  useEffect(() => {
    const searchForm = document.getElementById('searchForm') as HTMLFormElement;
    let timeout: NodeJS.Timeout;

    const handleInput = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        submit(searchForm);
      }, 300);
    };

    searchForm?.addEventListener('input', handleInput);
    return () => {
      searchForm?.removeEventListener('input', handleInput);
      clearTimeout(timeout);
    };
  }, [submit]);

  return (
    <div className="mb-6 space-y-4">
      <Form id="searchForm" onChange={handleChange} className="max-w-2xl">
        <div className="relative">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.get("q") || ""}
            placeholder="Search bookmarks..."
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            aria-label="Search bookmarks"
          />
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${
              isSearching ? "animate-spin" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isSearching ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            )}
          </svg>
        </div>
      </Form>

      <Form onChange={handleChange} className="flex gap-4 items-center">
        <select
          name="sort"
          defaultValue={searchParams.get("sort") || "newest"}
          className="rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow hover:shadow-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
        </select>

        <select
          name="tag"
          defaultValue={searchParams.get("tag") || ""}
          className="rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow hover:shadow-sm"
        >
          <option value="">All tags</option>
          {tags?.map((tag) => (
            <option key={tag.name} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      </Form>
    </div>
  );
}