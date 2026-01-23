import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState, useRef } from 'react';
import { EndpointService } from 'Frontend/generated/endpoints';
import type ImageCacheEvent from 'Frontend/generated/com/github/laplusijns/ImageCacheEvent.js';
import type FileObject from 'Frontend/generated/com/github/laplusijns/FileObject.js';
import EventTpes from 'Frontend/generated/com/github/laplusijns/EventType';
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
// avoid img too small break card
const MIN_CARD_WIDTH = 200;
function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);

  return now;
}
function formatRemain(ms: number) {
  if (ms <= 0) return translate(key`text.expired`);

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
export default function ViewImagesView() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const imageBlobs = useRef<Map<string, Blob>>(new Map());
  const [contextPath, setContextPath] = useState('');
  const now = useNow();

  useEffect(() => {
    EndpointService.contextPath().then(setContextPath);
  }, []);

  const onMessageReceived = (receiveFiles: ImageCacheEvent[]) => {
    setFiles((prevFiles) => {
      let updatedFiles = [...prevFiles];
      receiveFiles.forEach((file) => {
        if (file?.type === EventTpes.ADD) {
          if (!updatedFiles.some((f) => f.uuid === file.uuid)) {
            updatedFiles.push(file);
          }
        } else if (file?.type === EventTpes.DELETE) {
          updatedFiles = updatedFiles.filter((f) => f.uuid !== file.uuid);
        } else if (file?.type === EventTpes.DELETE_ALL) {
          updatedFiles = [];
        }
      });
      return updatedFiles;
    });
  };
  const updateImageSize = (fileUuid: string, isThumbnail: boolean, width: number, height: number) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.uuid !== fileUuid) return file;

        if (isThumbnail && file.thumbnail) {
          if (file.thumbnail.width && file.thumbnail.height) return file;

          return {
            ...file,
            thumbnail: {
              ...file.thumbnail,
              width,
              height,
            },
          };
        }

        if (!file.width || !file.height) {
          return {
            ...file,
            width,
            height,
          };
        }

        return file;
      }),
    );
  };
  const getOriginalBlob = async (uuid: string): Promise<Blob> => {
    const cached = imageBlobs.current.get(uuid);
    if (cached) return cached;

    const res = await fetch(`${contextPath}/blob/${uuid}`);
    if (!res.ok) throw new Error('下載原始圖片失敗');

    const blob = await res.blob();
    imageBlobs.current.set(uuid, blob);
    return blob;
  };

  useEffect(() => {
    const subscription = EndpointService.subscribeImageUpdates()
      .onNext((receiveFiles) => onMessageReceived(receiveFiles))
      .onSubscriptionLost(() => ActionOnLostSubscription.RESUBSCRIBE);
    EndpointService.downloadFileStrs()
      .then((uuids: string[]) => {
        uuids.forEach((uuid: string) => {
          EndpointService.downloadFile(uuid).then((file) => {
            if (file) {
              setFiles((prev) => [...prev, file]);
            }
          });
        });
      })
      .catch((error) => {
        console.error(translate(key`notify.download.fail`), error);
      });
    return () => {
      subscription.cancel();
    };
  }, []);

  const copyImage = async (uuid: string) => {
    try {
      const blob = await getOriginalBlob(uuid);

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
    if (!confirm(translate(key`confirm.delete.all`))) {
      return;
    }
    EndpointService.deleteAllFiles()
      .then(() => {
        setFiles([]);
        imageBlobs.current.clear();

        Notification.show(translate(key`notify.delete.all.success`), {
          duration: 2000,
          position: 'top-center',
          theme: 'success',
        });
      })
      .catch((err) => {
        console.error('刪除全部失敗', err);
        Notification.show(translate(key`notify.delete.all.fail`), {
          duration: 2000,
          position: 'top-center',
          theme: 'error',
        });
      });
  };

  return (
    <div className="flex flex-wrap gap-m p-l">
      <Button className="w-full" theme="error primary" onClick={deleteAllImages}>
        {translate(key`btn.delete.all`)}
      </Button>
      {files.map((file) => {
        const displayFile = file.thumbnail || file; // 優先使用 thumbnail
        const isThumbnail = !!file.thumbnail;
        const rawWidth = displayFile.width ?? MIN_CARD_WIDTH;
        const cardWidth = Math.max(rawWidth, MIN_CARD_WIDTH);
        return (
          <Card
            key={file.uuid}
            theme="outlined"
            style={{
              width: 'fit-content',
              maxWidth: '100%',
            }}>
            <div
              slot="title"
              style={{
                maxWidth: cardWidth,
                wordBreak: 'break-all',
                whiteSpace: 'normal',
              }}>
              {file.originalFilename!}
            </div>
            <div
              slot="subtitle"
              style={{
                maxWidth: cardWidth,
                wordBreak: 'break-all',
                whiteSpace: 'normal',
                fontSize: '0.8em',
              }}>
              {file.uuid}
            </div>
            <img
              src={isThumbnail ? 'blob/thumbnail/' + file.uuid : 'blob/' + file.uuid}
              alt={file.originalFilename}
              width={displayFile.width ?? 200}
              height={displayFile.height ?? 200}
              onLoad={(e) => {
                const img = e.currentTarget;
                updateImageSize(file.uuid!, isThumbnail, img.naturalWidth, img.naturalHeight);
                if (isThumbnail) return;
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
                }, file.contentType);
              }}
            />
            {(() => {
              if (!file.expired) return null;
              const remainMs = Math.max(file.expired - now, 0);
              const remainText = formatRemain(remainMs);

              return <div className="font-bold">{remainText}</div>;
            })()}
            <div
              slot="footer"
              style={{
                maxWidth: cardWidth,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
              }}>
              <Button theme="error" onClick={() => deleteImage(file.uuid!)}>
                {translate(key`btn.copy.delete`)}
              </Button>
              <Button onClick={() => downloadImage(file.uuid!, file.originalFilename!)}>
                {translate(key`btn.download.image`)}
              </Button>
              <br />
              <Button onClick={() => copyImageUrl(file.uuid!)}>{translate(key`btn.copy.url`)}</Button>
              <Button onClick={() => copyImage(file.uuid!)}>{translate(key`btn.copy.image`)}</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
