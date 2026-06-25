import { useDropzone } from "react-dropzone";
import { useEffect, useState } from "react";
import { Upload, FileCheck2, X } from "lucide-react";
import { motion } from "framer-motion";

export function ProofUpload({ onComplete }: { onComplete: (filename: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { "image/*": [], "application/pdf": [] },
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setProgress(0);
      }
    },
  });

  useEffect(() => {
    if (!file) return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => onComplete(file.name), 350);
        }
        return next;
      });
    }, 180);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (file) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-6 w-6 text-emerald-600" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800">{file.name}</div>
            <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={() => { setFile(null); setProgress(0); }} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
            className={`h-full ${progress >= 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
          />
        </div>
        <div className="mt-2 text-right text-xs font-medium text-slate-500">{Math.round(progress)}%</div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 sm:p-10 text-center transition ${
        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 text-indigo-600" />
      <div className="mt-3 text-sm font-semibold text-slate-800">Upload your payment screenshots</div>
      <div className="text-xs text-slate-500">PNG, JPG, or PDF up to 10MB</div>
    </div>
  );
}
