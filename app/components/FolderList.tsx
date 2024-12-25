import { Form, useSearchParams } from "@remix-run/react";
import type { Folder } from "~/types";

interface FolderListProps {
  folders: Folder[];
  activeCount: { [key: string]: number };
}

export function FolderList({ folders, activeCount }: FolderListProps) {
  const [searchParams] = useSearchParams();
  const currentFolder = searchParams.get("folder");

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-semibold text-gray-900 mb-3">Folders</h2>
      <div className="space-y-1">
        <Form className="contents">
          <button
            type="submit"
            name="folder"
            value=""
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              !currentFolder
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            All Bookmarks
            <span className="ml-2 text-xs text-gray-500">
              ({Object.values(activeCount).reduce((a, b) => a + b, 0)})
            </span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="submit"
              name="folder"
              value={folder.id}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                currentFolder === folder.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {folder.name}
              <span className="ml-2 text-xs text-gray-500">
                ({activeCount[folder.id] || 0})
              </span>
            </button>
          ))}
        </Form>
      </div>
    </div>
  );
}