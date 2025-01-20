let fs = {};
let isExpo = false;
const isLoaded = () => fs.documentDirectory || fs.DocumentDirectoryPath;

if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
  try {
    fs = require("@dr.pogodin/react-native-fs");
  } catch {}
  if (!isLoaded()) {
    try {
      fs = require("react-native-fs");
    } catch {}
  }
  if (!isLoaded()) {
    try {
      fs = require("expo-file-system");
      isExpo = true;
    } catch {}
  }
}

const join = (...paths) => paths.join("/").replace("//", "/");
const normalize = (path) => isExpo && path.startsWith("/") ? `file://${path}` : path;
const basename = (path) => path.split("/").pop();

const TemporaryDirectoryPath = isExpo ? fs.cacheDirectory : fs.TemporaryDirectoryPath;
const DocumentDirectoryPath = isExpo ? fs.documentDirectory : fs.DocumentDirectoryPath;
const CachesDirectoryPath = isExpo ? fs.cacheDirectory : fs.CachesDirectoryPath;

if (!isLoaded()) {
  fs = new Proxy({}, {
    get(target, prop) {
      throw new Error("No compatible FS library found");
    },
  });
}

// Basic file operations

const readFile = (path, encoding = "utf8") => {
  if (isExpo) {
    return fs.readAsStringAsync(normalize(path), { encoding });
  }
  return fs.readFile(path, encoding);
};

const writeFile = (path, data, encoding = "utf8") => {
  if (isExpo) {
    return fs.writeAsStringAsync(normalize(path), data, { encoding });
  }
  return fs.writeFile(path, data, encoding);
};

const appendFile = (path, data, encoding = "utf8") => {
  if (isExpo) {
    throw new Error("`appendFile` not supported on Expo");
  }
  return fs.appendFile(path, data, encoding);
};

const write = (path, data, position = 0, encoding = "utf8") => {
  if (isExpo) {
    throw new Error("`write` not supported on Expo");
  }
  return fs.write(path, data, position, encoding);
};

const readdir = (path) => {
  if (isExpo) {
    return fs.readDirectoryAsync(normalize(path));
  }
  return fs.readdir(path);
};

const readDir = async (path) => {
  if (isExpo) {
    const files = await fs.readDirectoryAsync((item) => normalize(join(path, item)));
    return Promise.all(files.map(stat));
  }
  return fs.readDir(path);
};

const mkdir = (path) => {
  if (isExpo) {
    return fs.makeDirectoryAsync(normalize(path), { intermediates: true });
  }
  return fs.mkdir(path);
};

const unlink = (path) => {
  if (isExpo) {
    return fs.deleteAsync(normalize(path));
  }
  return fs.unlink(path);
};

const moveFile = (path, newPath) => {
  if (isExpo) {
    return fs.moveAsync({ from: normalize(path), to: normalize(newPath) });
  }
  return fs.moveFile(path, newPath);
};

const copyFile = (path, newPath) => {
  if (isExpo) {
    return fs.copyAsync({ from: normalize(path), to: normalize(newPath) });
  }
  return fs.copyFile(path, newPath);
};

const stat = async (path) => {
  if (isExpo) {
    const { exists, isDirectory, modificationTime, size, uri } = await fs.getInfoAsync(normalize(path));
    if (!exists) {
      throw new Error("File does not exist");
    }
    return {
      name: basename(path),
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
      mtime: new Date(modificationTime),
      originalFilepath: uri,
      path: uri.replace("file://", ""),
      size,
    };
  }
  return fs.stat(path);
};

const exists = async (path) => {
  if (isExpo) {
    const info = await fs.getInfoAsync(normalize(path));
    return info.exists;
  }
  return fs.exists(path);
};

// Download and upload

const jobs = {};
let nextJobId = 0;

const downloadFile = (options) => {
  if (isExpo) {
    let bytesWritten = 0;
    let contentLength = 0;
    const {
      fromUrl,
      toFile,
      headers,
      background,
      cacheable,
      progress,
    } = options;
    const jobId = nextJobId++;
    const job = fs.createDownloadResumable(fromUrl, toFile, {
      cache: cacheable,
      headers,
      sessionType: background ? 0 : 1,
    }, ({ totalBytesExpectedToWrite, totalBytesWritten }) => {
      bytesWritten = totalBytesWritten;
      contentLength = totalBytesExpectedToWrite;
      progress?.({ jobId, bytesWritten, contentLength });
    });
    jobs[jobId] = job;
    return {
      jobId,
      promise: job.downloadAsync().then(() => {
        delete jobs[jobId];
        return {
          jobId,
          bytesWritten,
          statusCode: 200,
        };
      }).catch((error) => {
        delete jobs[jobId];
        throw error;
      }),
    };
  }
  return fs.downloadFile(options);
};

const stopDownload = async (jobId) => {
  if (isExpo) {
    const job = jobs[jobId];
    if (!job) {
      return;
    }
    await job.cancelAsync();
    delete jobs[jobId];
  }
  return fs.stopDownload(jobId);
};

const uploadFiles = (options) => {
  if (isExpo) {
    const {
      toUrl,
      files,
      method,
      headers,
      fields,
      progress,
      background,
    } = options;
    if (fields) {
      throw new Error("`fields` not supported on Expo");
    }
    if (files.length > 1) {
      throw new Error("Expo not support multiple files upload");
    }
    const file = files[0];
    const jobId = nextJobId++;
    const job = fs.createUploadTask(file.filepath, toUrl, {
      headers,
      httpMethod: method,
      sessionType: background ? 0 : 1,
    }, ({ totalBytesExpectedToSend, totalBytesSent }) => {
      progress?.({ jobId, totalBytesSent, totalBytesExpectedToSend });
    });
    jobs[jobId] = job;
    return {
      jobId,
      promise: job.uploadAsync().then(({ body }) => {
        delete jobs[jobId];
        return {
          jobId,
          statusCode: 200,
          headers: {},
          body,
        };
      }).catch((error) => {
        delete jobs[jobId];
        throw error;
      }),
    };
  }
  return fs.uploadFiles(options);
};

const stopUpload = async (jobId) => {
  if (isExpo) {
    const job = jobs[jobId];
    if (!job) {
      return;
    }
    await job.cancelAsync();
    delete jobs[jobId];
  }
  return fs.stopUpload(jobId);
};

module.exports = {
  DocumentDirectoryPath,
  CachesDirectoryPath,
  TemporaryDirectoryPath,
  readFile,
  writeFile,
  write,
  appendFile,
  readdir,
  readDir,
  mkdir,
  unlink,
  moveFile,
  copyFile,
  stat,
  exists,
  downloadFile,
  stopDownload,
  uploadFiles,
  stopUpload,
};
