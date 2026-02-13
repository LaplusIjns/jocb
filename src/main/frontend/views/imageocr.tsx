import { useEffect, useState, useRef } from 'react';
import {
  Notification,
  Upload,
  Select,
  TextArea,
  Button,
  type UploadRequestEvent,
  type UploadElement,
} from '@vaadin/react-components';
import { OcrEndpointService } from 'Frontend/generated/endpoints';
import OcrResponse from 'Frontend/generated/com/github/laplusijns/ocr/OcrResponse';
import LabelAndValue from 'Frontend/generated/com/github/laplusijns/LabelAndValue';
import Result from 'Frontend/generated/com/github/laplusijns/ocr/OcrResponse/Result';
import { key, translate } from '@vaadin/hilla-react-i18n';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';

export const config: ViewConfig = {
  menu: { order: 4, icon: 'line-awesome/svg/image-solid.svg', title: key`page.imageocr.title` },
  title: key`page.imageocr.title`,
};

export default function OcrDemoSimple() {
  const [texts, setTexts] = useState<LabelAndValue[]>([]); // 後端文字陣列
  const [result, setResult] = useState<string>(); // 後端文字陣列
  const uploadRef = useRef<UploadElement>(null);
  const subscriptionRef = useRef<any>(null);
  const jsessionidRef = useRef<any>(null);

  useEffect(() => {
    const jessionid = crypto.randomUUID();
    jsessionidRef.current = jessionid;
    subscriptionRef.current = OcrEndpointService.ocrResponseSubscription(jessionid).onNext((res: OcrResponse) => {
      if (res.result === Result.SUCCESS) {
        Notification.show(translate(key`notify.imageocr.success`), {
          duration: 2000,
          position: 'top-center',
        });
        setResult(res.response);
      } else if (res.result === Result.ERROR) {
        Notification.show(res.response, {
          duration: 2000,
          position: 'top-center',
          theme: 'error',
        });
      }
    });

    return () => {
      subscriptionRef.current?.cancel();
    };
  }, []);
  useEffect(() => {
    OcrEndpointService.lvs()
      .then((uuids: LabelAndValue[]) => {
        setTexts(uuids);
      })
      .catch((error) => {
        console.error(translate(key`notify.download.fail`), error);
      });
    return () => {};
  }, []);

  const handleChange = (event: any) => {
    // 取得選擇值
    const newValue = event.target.value;

    OcrEndpointService.ocrImageCache(newValue, jsessionidRef.current);
  };
  const handleUploadRequest = async (e: UploadRequestEvent) => {
    e.preventDefault();
    const uploadRef = e.target as UploadElement;
    OcrEndpointService.ocrImageFile(e.detail.file, jsessionidRef.current).finally(() => {
      uploadRef.files = [];
    });
  };
  const handleCopy = async () => {
    if (!result) {
      return;
    }
    navigator.clipboard
      .writeText(result)
      .then(() => {
        Notification.show(translate(key`notify.text.copy.success`), {
          duration: 1500,
          position: 'top-center',
        });
      })
      .catch((err) => {
        Notification.show(translate(key`notify.text.copy.fail`), {
          duration: 1500,
          position: 'top-center',
          theme: 'error',
        });
      });
  };

  return (
    <div className="flex flex-col h-full p-m" style={{ gap: 16 }}>
      {/* Select */}
      <Select
        label={translate(key`page.imageocr.select`)}
        placeholder="Select image uuid"
        items={texts.map((text) => ({
          label: text.label,
          value: text.value,
        }))}
        onValueChanged={handleChange}
      />
      {/* Upload */}
      <h5>{translate(key`page.imageocr.uploadwithoutsave`)}</h5>
      <Upload ref={uploadRef} noAuto accept="image/*" maxFiles={1} onUploadRequest={handleUploadRequest} />

      {/* OCR Result */}
      <br />
      <br />
      <Button theme="secondary" disabled={!result} onClick={handleCopy}>
        {translate(key`btn.copy.text`)}
      </Button>
      <TextArea
        label={translate(key`page.imageocr.result`)}
        readonly
        className="font-bold"
        style={{ width: '100%' }}
        value={result}
      />
    </div>
  );
}
