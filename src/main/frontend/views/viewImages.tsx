import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { EndpointService } from 'Frontend/generated/endpoints';
import type ImageCacheEvent from 'Frontend/generated/com/github/laplusijns/ImageCacheEvent.js';
import type FileObject from 'Frontend/generated/com/github/laplusijns/FileObject.js';
import { Button, Notification, Card } from '@vaadin/react-components';
import { ActionOnLostSubscription } from '@vaadin/hilla-frontend';
import { key, translate } from '@vaadin/hilla-react-i18n';

export const config: ViewConfig = {
  menu: {
    order: 0,
    icon: 'line-awesome/svg/photo-video-solid.svg',
    title: key`page.viewImages.title`,
  },
  title: key`page.viewImages.title`,
};

export default function ViewImagesView() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const imageBlobs = useRef<Map<string, Blob>>(new Map());
  let contextPath: string;
  EndpointService.contextPath().then((result) => {
    contextPath = result;
  });
  const onMessageReceived = (receiveFiles: ImageCacheEvent[]) => {
    setFiles((prevFiles) => {
      let updatedFiles = [...prevFiles];
      receiveFiles.forEach((file) => {
        if (file?.type === 'ADD') {
          if (!updatedFiles.some((f) => f.uuid === file.uuid)) {
            updatedFiles.push(file);
          }
        } else if (file?.type === 'DELETE') {
          updatedFiles = updatedFiles.filter((f) => f.uuid !== file.uuid);
        } else if (file?.type === 'DELETE_ALL') {
          updatedFiles = [];
        }
      });
      return updatedFiles;
    });
  };
  useEffect(() => {
    const subscription = EndpointService.subscribeImageUpdates()
      .onNext((receiveFiles) => onMessageReceived(receiveFiles))
      .onSubscriptionLost(() => ActionOnLostSubscription.RESUBSCRIBE);
    const fetchFiles = async () => {
      try {
        // 1. 先拿 UUID 陣列
        const uuids: string[] = await EndpointService.downloadFileStrs();

        // 2. 逐個下載檔案並立即更新
        for (const uuid of uuids) {
          EndpointService.downloadFile(uuid).then((file) => {
            if (file) {
              setFiles((prev) => [...prev, file]);
            }
          });
        }
      } catch (error) {
        console.error(translate(key`notify.download.fail`), error);
      }
    };

    fetchFiles();
    return () => {
      subscription.cancel();
    };
  }, []);

  const copyImage = async (uuid: string) => {
    try {
      const blob = imageBlobs.current.get(uuid);
      const a = true;
      if (!blob) {
        throw new Error('找不到圖片 Blob');
      }

      let clipboardBlob = blob;

      // 如果不是 PNG，就用 canvas 轉成 PNG
      if (blob.type !== 'image/png') {
        const img = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('無法取得 Canvas 上下文');
        ctx.drawImage(img, 0, 0);
        clipboardBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => {
            if (!b) throw new Error('Canvas 轉 PNG 失敗');
            resolve(b);
          }, 'image/png');
        });
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipboardBlob })]);

      Notification.show(translate(key`notify.copy.image.success`), {
        duration: 2000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('複製圖片失敗', error);
      Notification.show(translate(key`notify.copy.image.fail`), {
        duration: 2000,
        position: 'top-center',
        theme: 'error',
      });
    }
  };

  const deleteImage = async (uuid: string) => {
    EndpointService.deleteFile(uuid);
    // 更新 files
    setFiles((prev) => prev.filter((file) => file.uuid !== uuid));
    Notification.show(translate(key`notify.delete.success`), {
      duration: 2000,
      position: 'top-center',
      theme: 'success',
    });
  };
  const copyImageUrl = async (uuid: string) => {
    try {
      const url = `${globalThis.location.origin}${contextPath}/blob/${uuid}`;
      await navigator.clipboard.writeText(url);

      Notification.show(translate(key`notify.copy.image.url.success`), {
        duration: 2000,
        position: 'top-center',
      });
    } catch (err) {
      console.error('複製 URL 失敗', err);
      Notification.show(translate(key`notify.copy.image.url.fail`), {
        duration: 2000,
        position: 'top-center',
        theme: 'error',
      });
    }
  };
  const downloadImage = async (uuid: string, filename: string) => {
    try {
      const blob = imageBlobs.current.get(uuid);
      if (!blob) {
        throw new Error('找不到圖片 Blob');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      Notification.show(translate(key`notify.download.success`), {
        duration: 2000,
        position: 'top-center',
        theme: 'success',
      });
    } catch (err) {
      console.error('下載圖片失敗', err);
      Notification.show(translate(key`notify.download.fail`), {
        duration: 2000,
        position: 'top-center',
        theme: 'error',
      });
    }
  };
  const deleteAllImages = async () => {
    if (!confirm(translate(key`confirm.delete.all`))) return;
    try {
      // 建議後端提供此方法
      EndpointService.deleteAllFiles().then(() => {
        setFiles([]);
        imageBlobs.current.clear();

        Notification.show(translate(key`notify.delete.all.success`), {
          duration: 2000,
          position: 'top-center',
          theme: 'success',
        });
      });
    } catch (err) {
      console.error('刪除全部失敗', err);
      Notification.show(translate(key`notify.delete.all.fail`), {
        duration: 2000,
        position: 'top-center',
        theme: 'error',
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-m p-l">
      <Button className="w-full" theme="error primary" onClick={deleteAllImages}>
        {translate(key`btn.delete.all`)}
      </Button>
      {files.map((file) => (
        <Card
          key={file.uuid}
          theme="outlined"
          style={{
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}>
          <div
            slot="title"
            style={{
              maxWidth: '100%',
              wordBreak: 'break-all', // 長檔名可強制斷行
              whiteSpace: 'normal', // 允許換行
              overflowWrap: 'anywhere', // 現代瀏覽器推薦
            }}>
            {file.originalFilename!}
          </div>
          <div slot="subtitle">{file.uuid}</div>
          <img
            src={'blob/' + file.uuid!}
            alt={file.originalFilename}
            width={file.width}
            height={file.height}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
            }}
            onLoad={(e) => {
              const img = e.currentTarget;

              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;

              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              ctx.drawImage(img, 0, 0);

              canvas.toBlob((blob) => {
                if (blob) {
                  imageBlobs.current.set(file.uuid!, blob);
                }
              }, file.contentType); // 可依實際格式調整
            }}
          />
          <Button slot="footer" theme="error" onClick={() => deleteImage(file.uuid!)}>
            {translate(key`btn.copy.delete`)}
          </Button>
          <Button slot="footer" onClick={() => downloadImage(file.uuid!, file.originalFilename!)}>
            {translate(key`btn.download.image`)}
          </Button>
          <Button slot="footer" onClick={() => copyImageUrl(file.uuid!)}>
            {translate(key`btn.copy.url`)}
          </Button>
          <Button slot="footer" onClick={() => copyImage(file.uuid!)}>
            {translate(key`btn.copy.image`)}
          </Button>
        </Card>
      ))}
    </div>
  );
}
