"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

const AdminMediaPage = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch media items (would normally connect to API)
  useEffect(() => {
    // Simulated data fetching
    const mockData: MediaItem[] = [
      {
        id: "1",
        name: "banner.jpg",
        type: "image/jpeg",
        size: 245000,
        url: "/placeholder-banner.jpg",
        createdAt: new Date("2025-08-25"),
      },
      {
        id: "2",
        name: "video.mp4",
        type: "video/mp4",
        size: 10485760,
        url: "/placeholder-video.mp4",
        createdAt: new Date("2025-08-24"),
      },
      {
        id: "3",
        name: "document.pdf",
        type: "application/pdf",
        size: 512000,
        url: "/placeholder-document.pdf",
        createdAt: new Date("2025-08-23"),
      },
    ];
    setMediaItems(mockData);
  }, []);

  const handleFiles = useCallback((files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Add uploaded file to media list
          const newMedia: MediaItem = {
            id: Date.now().toString(),
            name: files[0].name,
            type: files[0].type,
            size: files[0].size,
            url: `/uploads/${Date.now()}-${files[0].name}`,
            createdAt: new Date(),
          };
          
          setMediaItems((prev) => [newMedia, ...prev]);
          toast.success(`Upload Successful: ${files[0].name} has been uploaded successfully.`);
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  }, [setMediaItems]);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    }
  }, [handleFiles]);

  const handleDelete = useCallback((id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
    toast.error("Deleted: Media file has been deleted.");
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type === "application/pdf") return "📄";
    return "📁";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Media Management</h1>
      
      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Upload className="h-12 w-12 text-gray-500" />
              <p className="text-lg text-gray-700">
                Drag and drop files here, or
                <Label htmlFor="file-upload" className="cursor-pointer ml-2 text-blue-600 hover:underline">
                  browse
                </Label>
              </p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, GIF, MP4, PDF</p>
              
              {isUploading && (
                <div className="mt-4 w-full max-w-md">
                  <div className="flex justify-between mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
          >
            Grid View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">Refresh</Button>
          <Button variant="destructive">Clear All</Button>
        </div>
      </div>

      {/* Media Grid/List */}
      <div className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}`}>
        {mediaItems.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
              viewMode === "grid" ? "" : "flex items-center"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {item.type.startsWith("image/") ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      width={viewMode === "grid" ? 120 : 80}
                      height={viewMode === "grid" ? 90 : 60}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="text-4xl">{getFileIcon(item.type)}</div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.type.split("/")[1]?.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {(item.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMediaPage;