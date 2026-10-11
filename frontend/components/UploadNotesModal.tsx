"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { API_BASE } from "@/lib/api";

type UploadState = "idle" | "selecting" | "uploading" | "success" | "error";

interface UploadNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const ALLOWED_FILE_TYPES = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

export default function UploadNotesModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadNotesModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateFile = (file: File): string | null => {
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return "Invalid file format. Please upload PDF, DOCX, or TXT documents only.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }

    setSelectedFile(file);
    setUploadState("selecting");
    setErrorMessage("");
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState("success");
          setUploadProgress(100);
          setTimeout(() => {
            onUploadSuccess?.();
            handleClose();
          }, 1500);
        } else {
          let errorMsg = "Upload failed. Please verify file format and try again.";
          try {
            const response = JSON.parse(xhr.responseText);
            errorMsg = response.detail || response.message || errorMsg;
          } catch {
            // default
          }
          setErrorMessage(errorMsg);
          setUploadState("error");
        }
      });

      xhr.addEventListener("error", () => {
        setErrorMessage("Network error connecting to backend at " + API_BASE);
        setUploadState("error");
      });

      xhr.addEventListener("abort", () => {
        setErrorMessage("Upload cancelled.");
        setUploadState("error");
      });

      xhr.open("POST", `${API_BASE}/notes/upload`);
      xhr.send(formData);
    } catch {
      setErrorMessage("Failed to connect to backend at " + API_BASE);
      setUploadState("error");
    }
  };

  const handleClose = () => {
    setUploadState("idle");
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage("");
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#dcfce7] text-[#16a34a]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Upload Study Notes</h2>
              <p className="text-xs text-slate-500">PDF, DOCX, or TXT documents up to 10 MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6">
          {/* Drag and Drop Area */}
          {!selectedFile && uploadState !== "success" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-[#16a34a] bg-[#f0fdf4]"
                  : "border-slate-300 bg-slate-50/50 hover:border-emerald-300 hover:bg-[#f0fdf4]/50"
              }`}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-xs text-[#16a34a] border border-emerald-100">
                <Upload className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">
                Drag and drop your study document here
              </p>
              <p className="mt-1 text-xs text-slate-500">or browse from your computer</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#15803d] transition-all"
              >
                <span>Browse Files</span>
                <span>↗</span>
              </button>
              <p className="mt-4 text-[11px] text-slate-400">
                Supported formats: PDF, DOCX, TXT (Maximum 10 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && uploadState !== "success" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcfce7] text-[#16a34a] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>

                  {/* Upload Progress */}
                  {uploadState === "uploading" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                        <span>Uploading & Extracting text...</span>
                        <span className="text-[#16a34a]">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-[#16a34a] rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {uploadState !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadState("idle");
                      setErrorMessage("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadState === "success" && (
            <div className="rounded-2xl border border-emerald-200 bg-[#f0fdf4] p-8 text-center animate-in zoom-in-95 duration-150">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a] shadow-xs">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-bold text-slate-900">Upload Successful!</p>
              <p className="mt-1 text-xs text-emerald-800">
                Text content extracted and indexed for AI questions and quizzes.
              </p>
            </div>
          )}

          {/* Error State */}
          {uploadState === "error" && errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Upload Failed</p>
                <p className="mt-0.5 text-xs text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploadState === "uploading"}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === "uploading" || uploadState === "success"}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{uploadState === "uploading" ? "Uploading..." : "Process Document"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
