export const TemporaryDirectoryPath: string;
export const DocumentDirectoryPath: string;
export const CachesDirectoryPath: string;

export type Encoding = 'ascii' | 'base64' | 'utf8';

export type FileInfo = {
  ctime?: Date;
  mtime:  Date;
  name: string;
  path: string;
  size: number;
  originalFilepath?: string;
  isDirectory: () => boolean;
  isFile: () => boolean;
};

export const readFile: (path: string, encoding?: Encoding) => Promise<string>;
export const writeFile: (path: string, data: string, encoding?: Encoding) => Promise<void>;
export const write: (path: string, data: string, position?: number, encoding?: Encoding) => Promise<void>;
export const appendFile: (path: string, data: string, encoding?: Encoding) => Promise<void>;
export const readdir: (path: string) => Promise<FileInfo[]>;
export const unlink: (path: string) => Promise<void>;
export const rename: (path: string, newPath: string) => Promise<void>;
export const stat: (path: string) => Promise<FileInfo>;
export const exists: (path: string) => Promise<boolean>;

export type DownloadFileOptions = {
  fromUrl: string;
  toFile: string;
  headers?: Record<string, string>;
  background?: boolean;
  discretionary?: boolean;
  cacheable?: boolean;
  progressInterval?: number;
  progressDivider?: number;
  begin?: (res: { jobId: number, statusCode: number, contentLength: number, headers: Headers }) => void;
  progress?: (res: { jobId: number, contentLength: number, bytesWritten: number }) => void;
  resumable?: () => void;
  connectionTimeout?: number;
  readTimeout?: number;
  backgroundTimeout?: number;
};

export type DownloadJob = {
  jobId: number;
  promise: Promise<{
    jobId: number;
    bytesWritten: number;
    statusCode: number;
  }>;
};

export const downloadFile: (options: DownloadFileOptions) => DownloadJob;
export const stopDownload: (jobId: number) => Promise<void>;

export type UploadItem = {
  name?: string;
  filename: string;
  filepath: string;
  filetype?: string;
};

export type UploadFileOptions = {
  toUrl: string;
  binaryStreamOnly?: boolean;
  files: UploadItem[];
  headers?: Record<string, string>;
  fields?: Record<string, string>;
  method?: 'POST' | 'PUT' | 'PATCH';
  begin?: (res: { jobId: number }) => void;
  progress?: (res: { jobId: number, totalBytesExpectedToSend: number, totalBytesSent: number }) => void;
};

export type UploadJob = {
  jobId: number;
  promise: Promise<{
    jobId: number;
    statusCode: number;
    headers: Headers;
    body: string;
  }>;
};

export const uploadFiles: (options: UploadFileOptions) => UploadJob;
export const stopUpload: (jobId: number) => Promise<void>;
