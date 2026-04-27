"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { documentsApi } from "@/lib/api/django-client";

interface PhotoUploadProps {
  onPhotoUpload: (file: File) => void;
  label?: string;
  required?: boolean;
  maxSizeMB?: number;
  photoUrl?: string;
  requireSquare?: boolean;
  requireAspectRatio?: [number, number];
  minWidthPx?: number;
  minHeightPx?: number;
  validateRealTime?: boolean;
  onVerificationChange?: (isVerified: boolean) => void;
}

export function PhotoUpload({
  onPhotoUpload,
  label = "Profile Photo",
  required = true,
  maxSizeMB = 5,
  photoUrl,
  requireSquare = false,
  requireAspectRatio,
  minWidthPx,
  minHeightPx,
  validateRealTime = false,
  onVerificationChange,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photoUrl || null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setWarning("");
    setValidationResult(null);
    setIsVerified(false);
    onVerificationChange?.(false);

    // Check for GIF
    if (file.type === "image/gif") {
      setError("GIF images are not supported for photo verification.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = async () => {
        try {
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          // Basic client-side checks
          if (requireSquare && w !== h) {
            setWarning("Photo is not square. Square (1:1) is recommended.");
          }
          if (requireAspectRatio && Array.isArray(requireAspectRatio)) {
            const [rw, rh] = requireAspectRatio;
            const target = rw / rh;
            const actual = w / h;
            const tol = 0.05; // Increased tolerance
            if (Math.abs(actual - target) > tol) {
              setWarning(
                `Photo is not ${rw}:${rh} ratio. ${rw}:${rh} is recommended.`,
              );
            }
          }

          if (minWidthPx && w < minWidthPx) {
            setError(`Photo width must be at least ${minWidthPx}px`);
            setIsUploading(false);
            return;
          }
          if (minHeightPx && h < minHeightPx) {
            setError(`Photo height must be at least ${minHeightPx}px`);
            setIsUploading(false);
            return;
          }

          // Real-time AI validation if requested
          if (validateRealTime) {
            setIsValidating(true);
            try {
              const result = await documentsApi.validatePhoto(file);
              setValidationResult(result);

              if (result.status === "verified_true" || result.is_verified) {
                setSuccess("Photo verified: Real portrait detected");
                setIsVerified(true);
                onVerificationChange?.(true);
              } else {
                // Extract readable message from details if it contains JSON
                let displayMsg = result.details || result.message || "Not a clear portrait";
                
                // Check for network errors in the details string (Backend AI service failures)
                const networkKeywords = [
                  "Failed to resolve",
                  "getaddrinfo failed",
                  "HTTPSConnectionPool",
                  "Max retries exceeded",
                  "NameResolutionError",
                  "OpenRouter request failed",
                  "connection error"
                ];

                const hasNetworkError = networkKeywords.some(keyword => 
                  displayMsg.toLowerCase().includes(keyword.toLowerCase())
                );

                if (hasNetworkError) {
                  displayMsg = "Check your internet connection";
                } else {
                  try {
                    if (displayMsg.includes("Openrouter:")) {
                      const jsonPart = displayMsg.split("Openrouter:")[1].trim();
                      const parsed = JSON.parse(jsonPart);
                      displayMsg =
                        parsed.summary ||
                        parsed.domainValidation?.checks?.find(
                          (c: any) => !c.passed,
                        )?.message ||
                        displayMsg;
                    }
                  } catch (e) {
                    // If parsing fails but we didn't find network keywords, 
                    // we can try to clean up the message if it's too long
                    if (displayMsg.length > 100) {
                      displayMsg = "Photo verification could not be completed. Please ensure you uploaded a clear portrait.";
                    }
                  }
                }
                
                if (hasNetworkError) {
                  setWarning("Check your internet connection");
                } else {
                  setWarning(`Photo verification failed: ${displayMsg}`);
                }
                setIsVerified(false);
                onVerificationChange?.(false);
              }
            } catch (err: any) {
              console.error("[clms] AI Photo validation failed:", err);
              
              const errorMessage = String(err?.message || "").toLowerCase();
              const isNetworkError = 
                errorMessage.includes("network error") || 
                errorMessage.includes("failed to fetch") || 
                errorMessage.includes("getaddrinfo") ||
                errorMessage.includes("timeout") ||
                err?.status === 408 ||
                err?.status === 0;

              if (isNetworkError) {
                setWarning("Check your internet connection");
              } else {
                // Don't block the upload if AI fails for other reasons, just show warning
                setWarning(
                  "Could not complete AI verification, but photo meets basic requirements.",
                );
              }
              setIsVerified(false);
              onVerificationChange?.(false);
            } finally {
              setIsValidating(false);
            }
          } else {
            // If real-time validation is disabled, we consider it verified for UI flow purposes
            // or we might want to change this behavior if strictness is required.
            setIsVerified(true);
            onVerificationChange?.(true);
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            setPreview(base64String);
            setFileName(file.name);
            onPhotoUpload(file);
            if (!validateRealTime) {
              setSuccess("Photo uploaded successfully");
              setTimeout(() => setSuccess(""), 3000);
            }
          };
          reader.readAsDataURL(file);
        } finally {
          URL.revokeObjectURL(objectUrl);
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setError("Failed to read image");
        URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
      };
      img.src = objectUrl;
    } catch (err) {
      setError("Failed to process image");
      console.error("[clms] Photo upload error:", err);
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview(null);
    setFileName("");
    setIsVerified(false);
    onVerificationChange?.(false);
    // parent may optionally clear stored file; no-op here
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {!error && warning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {warning}
          </AlertDescription>
        </Alert>
      )}
      {isValidating && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            AI system is verifying photo authenticity...
          </AlertDescription>
        </Alert>
      )}

      {preview ? (
        <div className="space-y-4">
          <div className="relative w-full max-w-xs">
            <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-border bg-muted">
              <NextImage
                src={preview || "/placeholder.svg"}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Change Photo"}
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
    </div>
  );
}
