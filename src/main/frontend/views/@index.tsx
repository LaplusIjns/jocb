import { useEffect, useRef, useState } from 'react';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { EndpointService } from 'Frontend/generated/endpoints';
import { key, translate } from '@vaadin/hilla-react-i18n';
import {
  Notification,
  Upload,
  type UploadElement,
  type UploadRequestEvent,
  type UploadFile,
  Dialog,
  Card,
} from '@vaadin/react-components';
type PreviewItem = {
  file: UploadFile;
  previewUrl?: string;
};
export const config: ViewConfig = {
  menu: { order: 0, icon: 'line-awesome/svg/file-upload-solid.svg', title: key`page.index.title` },
  title: key`page.index.title`,
};
export default function UploadView() {
  const uploadRef = useRef<UploadElement>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  // 用於控制哪個 Dialog 打開
  const [selectedPreview, setSelectedPreview] = useState<PreviewItem | null>(null);

  /* ====== 貼上圖片支援 ====== */
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;

      const pastedFiles = Array.from(event.clipboardData.files);
      if (pastedFiles.length === 0) return;

      event.preventDefault();

      const upload = uploadRef.current;
      if (!upload) return;

      (upload as any)._addFiles(pastedFiles);
    };
    globalThis.addEventListener('paste', handlePaste);
    return () => globalThis.removeEventListener('paste', handlePaste);
  }, []);

  /* ====== 產生圖片預覽 ====== */
  const handleFilesChanged = (e: any) => {
    const newFiles: UploadFile[] = [...e.detail.value];

    previews.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });

    const newPreviews: PreviewItem[] = newFiles.map((f) => {
      if (f?.type.startsWith('image/')) {
        return { file: f, previewUrl: URL.createObjectURL(f) };
      }
      return { file: f };
    });

    setPreviews(newPreviews);
  };
  const handleUploadRequest = async (e: UploadRequestEvent) => {
    e.preventDefault();
    const uploadRef = e.target as UploadElement;
    EndpointService.uploadFile(e.detail.file)
      .then((fileId) => {
        uploadRef.files = uploadRef.files.map((file) => {
          file.status = '';
          file.complete = true;
          return file;
        });
        Notification.show(translate(key`file.upload.received`) + `: ${fileId}`, {
          duration: 2000,
          theme: 'success',
          position: 'top-center',
        });
      })
      .catch((err) => {
        let message = translate(key`status.unknown`);
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const response = err.response;
          const status = response?.status;

          if (status === 413) {
            message = translate(key`file.upload.tooLarge`);
          } else {
            message = translate(key`status.fail`);
          }

          // 一般 JS Error
        } else if (err instanceof Error) {
          message = err.message;
        }
        Notification.show(message, {
          position: 'middle',
          duration: 1500,
          theme: 'error',
        });
      });
  };

  return (
    <div className="flex flex-col h-full p-l box-border" style={{ gap: 16 }}>
      <Upload
        ref={uploadRef}
        onFilesChanged={handleFilesChanged}
        onUploadRequest={handleUploadRequest}
        noAuto
        accept="image/*"
        className="w-full"
      />

      {/* ====== 縮圖預覽 ====== */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {previews.map((p, index) =>
          p.previewUrl ? (
            <Card key={index} theme="outlined" style={{ maxWidth: '300px', maxheight: '450px' }}>
              <div
                slot="title"
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                {p.file.name}
              </div>
              <img
                src={p.previewUrl}
                alt="preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--lumo-contrast-20pct)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedPreview(p)} // 點擊圖片打開 Dialog
              />
            </Card>
          ) : null,
        )}
      </div>

      {/* ====== Dialog 顯示大圖 ====== */}
      {selectedPreview && (
        <Dialog
          headerTitle={selectedPreview.file.name}
          opened={true}
          onOpenedChanged={(e: any) => {
            if (!e.detail.value) setSelectedPreview(null); // 關閉時清空
          }}>
          <img
            src={selectedPreview.previewUrl}
            alt={selectedPreview.file.name}
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
          />
        </Dialog>
      )}
    </div>
  );
}
