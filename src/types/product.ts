// types/product.ts
export interface UploadedImage {
  file_url: string;
  file_name: string;
}

export interface UploadImageResponse {
  success: boolean;
  message: string;
  data: {
    uploaded: UploadedImage[];
    failed: string[];
  };
}