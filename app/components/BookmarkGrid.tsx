import type { SerializeFrom } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import type { loader } from "~/routes/_index";
import { motion } from "framer-motion";
import { useState } from "react";

interface BookmarkGridProps {
  bookmarks: SerializeFrom<typeof loader>["bookmarks"];
}

function BookmarkCard({ bookmark, isDeleting }: { bookmark: SerializeFrom<typeof loader>["bookmarks"][0], isDeleting: boolean }) {
  const [faviconError, setFaviconError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow relative"
    >
      <a
        href={`/bookmarks/${bookmark.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Edit ${bookmark.title}`}
        role="button"
        tabIndex={0}
      />
      <div className="flex items-center gap-3 mb-4">
        <img
          src={faviconError ? "/favicon-fallback.png" : bookmark.favicon || "/favicon-fallback.png"}
          alt=""
          onError={() => setFaviconError(true)}
          className="w-6 h-6"
        />
        <h2 className="text-xl font-semibold text-gray-900 truncate">
          {bookmark.title}
        </h2>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">
        {bookmark.summary || bookmark.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {bookmark.tags?.map(({ tag }) => (
          <span
            key={tag?.name}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 transition-colors hover:bg-indigo-200"
          >
            {tag?.name}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{bookmark.folder?.name}</span>
        <div className="flex items-center gap-3 relative z-10">
          <Form 
            method="post"
            action={`/bookmarks/${bookmark.id}`}
            onSubmit={(e) => {
              if (!confirm("Are you sure you want to delete this bookmark?")) {
                e.preventDefault();
              }
            }}
            className="relative z-10"
          >
            <button
              type="submit"
              name="intent"
              value="delete"
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
              className="text-red-600 hover:text-red-800 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-sm"
            >
              Delete
            </button>
          </Form>
          <a
            href={bookmark.url}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-sm"
          >
            Visit →
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function BookmarkGrid({ bookmarks }: BookmarkGridProps) {
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarks?.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} isDeleting={isDeleting} />
      ))}
    </div>
  );
}