import { useDropzone } from "react-dropzone";
import { useEffect, useState } from "react";
import { Upload, FileCheck2, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export function ProofUpload({ onComplete }: { onComplete: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { "image/*": [], "application/pdf": [] },
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setProgress(0);
        setError(null);
      }
    },
  });

  useEffect(() => {
    if (!file) return;
    setProgress(0);
    setError(null);

    let isCancelled = false;
    let mockProgressInterval: any;

    const performUpload = async () => {
      try {
        // 1. Generate unique file name
        const fileExt = file.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(2, 7);
        const fileName = `${Date.now()}-${randomStr}.${fileExt}`;

        // Start mock progress loading indicator
        mockProgressInterval = setInterval(() => {
          setProgress((p) => {
            // Cap mock progress at 85% until upload finishes
            if (p >= 85) return p;
            return p + Math.random() * 15 + 5;
          });
        }, 150);

        // 2. Upload file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from("payment-receipts")
          .getPublicUrl(fileName);

        if (isCancelled) return;

        // Fast forward progress bar to 100% on success
        clearInterval(mockProgressInterval);
        setProgress(100);
        
        setTimeout(() => {
          if (!isCancelled) {
            onComplete(publicUrl);
          }
        }, 400);

      } catch (err: any) {
        console.error("Storage upload error:", err);
        if (!isCancelled) {
          clearInterval(mockProgressInterval);
          setError(err.message || "Failed to upload file to Supabase Storage.");
          setFile(null);
          setProgress(0);
        }
      }
    };

    performUpload();

    return () => {
      isCancelled = true;
      if (mockProgressInterval) clearInterval(mockProgressInterval);
    };
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
          <button 
            onClick={() => { setFile(null); setProgress(0); setError(null); }} 
            className="rounded p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
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
    <div className="space-y-3">
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
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-100">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
