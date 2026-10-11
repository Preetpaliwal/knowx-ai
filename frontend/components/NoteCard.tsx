"use client";

type Note = {
  id: string;
  title: string;
  fileType: string;
  excerpt: string;
  date: string;
  content?: string | null;
};

export default function NoteCard({ note }: { note: Note }) {
  const fileType = note.fileType.split("/").pop()?.toUpperCase() || "FILE";
  const hasExtractedText = Boolean(note.content?.trim());

  return (
    <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-primary-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {note.title}
        </h3>
        <span className="text-xs font-medium text-gray-400">{note.date}</span>
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
        {note.excerpt || "No preview available."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {fileType}
        </span>
        <span className="text-xs text-gray-500">
          {hasExtractedText ? "Text extracted" : "Text unavailable"}
        </span>
      </div>
    </div>
  );
}
