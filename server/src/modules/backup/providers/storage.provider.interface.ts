import fs from "fs";

export interface IStorageProvider {
  /**
   * Upload a file to storage and return its path or URL
   */
  upload(filePath: string, fileName: string): Promise<string>;
  
  /**
   * Download a file from storage to local disk
   */
  download(fileName: string, destinationPath: string): Promise<void>;
  
  /**
   * Delete a file from storage
   */
  delete(fileName: string): Promise<void>;

  /**
   * Get a readable stream of the file
   */
  getFileStream(fileName: string): Promise<fs.ReadStream>;
}
