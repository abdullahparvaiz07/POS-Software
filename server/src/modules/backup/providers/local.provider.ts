import fs from "fs";
import path from "path";
import { IStorageProvider } from "./storage.provider.interface";

export class LocalDiskStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(filePath: string, fileName: string): Promise<string> {
    const destinationPath = path.join(this.baseDir, fileName);
    
    // If it's already in the destination, do nothing
    if (path.resolve(filePath) === path.resolve(destinationPath)) {
      return destinationPath;
    }

    // Otherwise, copy to the backups folder
    fs.copyFileSync(filePath, destinationPath);
    return destinationPath;
  }

  async download(fileName: string, destinationPath: string): Promise<void> {
    const sourcePath = path.join(this.baseDir, fileName);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`File not found: ${fileName}`);
    }
    fs.copyFileSync(sourcePath, destinationPath);
  }

  async delete(fileName: string): Promise<void> {
    const filePath = path.join(this.baseDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getFileStream(fileName: string): Promise<fs.ReadStream> {
    const filePath = path.join(this.baseDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName}`);
    }
    return fs.createReadStream(filePath);
  }
}
