import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { useEffect, useState } from 'react';
import { EndpointService } from 'Frontend/generated/endpoints';
import { Button, Notification, Card, TextArea, Dialog } from '@vaadin/react-components';
import { ActionOnLostSubscription } from '@vaadin/hilla-frontend';
import type TextCacheEvent from 'Frontend/generated/com/github/laplusijns/TextCacheEvent.js';
import EventTpes from 'Frontend/generated/com/github/laplusijns/EventType';
import { key, translate } from '@vaadin/hilla-react-i18n';

export const config: ViewConfig = {
  menu: { order: 2, icon: 'line-awesome/svg/font-solid.svg', title: key`page.textClip.title` },
  title: key`page.textClip.title`,
};

export default function ViewImagesView() {
  const [text, setText] = useState(''); // 輸入文字
  const [texts, setTexts] = useState<string[]>([]); // 後端文字陣列
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpened, setDialogOpened] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const truncateText = (text: string, maxLength = 100) =>
    text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  // 取得後端文字
  const loadTexts = async () => {
    setLoading(true);
    try {
      const result = await EndpointService.downloadTexts();
      setTexts(result);
    } catch (err) {
      console.error(err);
      Notification.show(translate(key`notify.text.fail`), { duration: 2000, theme: 'error', position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        try {
          const clipboardText = await navigator.clipboard.readText();
          setText((prev) => prev + clipboardText);
        } catch {
          Notification.show(translate(key`notify.readyClip.fail`), {
            theme: 'error',
            duration: 2000,
          });
        }
      }
    };
    loadTexts();
    globalThis.addEventListener('keydown', handleKeyDown);

    // 訂閱文字更新
    const subscription = EndpointService.subscribeTextUpdates()
      .onNext((updates: TextCacheEvent[]) => {
        // update 物件範例: { type: 'add' | 'remove', text: '...' }
        updates.forEach((update: TextCacheEvent) => {
          if (update.type === EventTpes.ADD) {
            setTexts((prevTexts) => (prevTexts.includes(update.text) ? prevTexts : [...prevTexts, update.text]));
          } else if (update.type === EventTpes.DELETE) {
            setTexts((prevTexts) => prevTexts.filter((t) => t !== update.text));
          }
        });
      })
      .onSubscriptionLost(() => ActionOnLostSubscription.RESUBSCRIBE);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
      subscription.cancel();
    };
  }, []);

  // 上傳文字
  const handleSave = async () => {
    if (!text.trim()) {
      Notification.show(translate(key`notify.text.remind`), { duration: 2000, theme: 'error', position: 'top-center' });
      return;
    }

    setSaving(true);
    try {
      await EndpointService.uploadText(text);
      Notification.show(translate(key`notify.text.success`), {
        duration: 2000,
        theme: 'success',
        position: 'top-center',
      });
      setText(''); // 清空輸入欄
      loadTexts(); // 重新載入文字
    } catch (err) {
      console.error(err);
      Notification.show(translate(key`notify.text.fail`), { duration: 2000, theme: 'error', position: 'top-center' });
    } finally {
      setSaving(false);
    }
  };

  // 複製單個文字
  const copyText = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      Notification.show(translate(key`notify.text.copy.success`), {
        duration: 2000,
        theme: 'success',
        position: 'top-center',
      });
    } catch {
      Notification.show(translate(key`notify.text.copy.fail`), {
        duration: 2000,
        theme: 'error',
        position: 'top-center',
      });
    }
  };
  const deleteAllTexts = async () => {
    if (!confirm(translate(key`confirm.delete.all`))) return;
    try {
      // 建議後端提供此方法
      EndpointService.deleteAllTexts().then(() => {
        setTexts([]);

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
    <div className="flex flex-col h-full p-m" style={{ gap: 16 }}>
      <TextArea
        label={translate(key`textarea.input`)}
        value={text}
        onValueChanged={(e) => setText(e.detail.value)}
        placeholder={translate(key`textarea.input.hint`)}
        style={{ maxHeight: '75vh' }}
      />
      <div className="flex flex-row" style={{ gap: 8 }}>
        <Button theme="primary" onClick={handleSave} disabled={saving}>
          {saving ? translate(key`textarea.btn.uploading`) : translate(key`textarea.btn.text`)}
        </Button>

        <Button theme="error primary" onClick={deleteAllTexts}>
          {translate(key`btn.delete.all`)}
        </Button>
      </div>

      <h3>{translate(key`page.textclip.alreadyupload`)}</h3>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {loading ? (
          <div>載入中...</div>
        ) : texts.length === 0 ? (
          <div>{translate(key`page.textclip.notext`)}</div>
        ) : (
          texts.map((t, index) => (
            <Card
              key={index}
              theme="outlined"
              style={{
                maxWidth: '300px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedText(t);
                setDialogOpened(true);
              }}>
              <p
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '120px',
                }}>
                {truncateText(t)}
              </p>

              <div slot="footer" style={{ display: 'flex', gap: 8 }}>
                <Button
                  theme="secondary"
                  onClick={(e) => {
                    e.stopPropagation(); // 避免觸發 Card click
                    copyText(t);
                  }}>
                  {translate(key`btn.copy.text`)}
                </Button>

                <Button
                  theme="error"
                  onClick={async (e) => {
                    e.stopPropagation(); // 避免觸發 Card click
                    try {
                      await EndpointService.deleteText(t);
                      setTexts((prev) => prev.filter((text) => text !== t)); // 前端立即移除
                      Notification.show(translate(key`notify.delete.success`), {
                        duration: 2000,
                        theme: 'success',
                        position: 'top-center',
                      });
                    } catch (err) {
                      console.error(err);
                      Notification.show(translate(key`notify.delete.fail`), {
                        duration: 2000,
                        theme: 'error',
                        position: 'top-center',
                      });
                    }
                  }}>
                  {translate(key`btn.copy.delete`)}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      {texts.length > 0 && (
        <Button theme="contrast" onClick={() => copyText(texts.join('\n'))}>
          {translate(key`btn.copy.text.all`)}
        </Button>
      )}
      <Dialog
        header-title={translate(key`textclip.dialog.title`)}
        opened={dialogOpened}
        onOpenedChanged={(e) => setDialogOpened(e.detail.value)}
        footer={
          <>
            <Button theme="secondary" onClick={() => copyText(selectedText)}>
              {translate(key`btn.copy.text`)}
            </Button>
            <Button theme="primary" onClick={() => setDialogOpened(false)}>
              {translate(key`btn.close.text`)}
            </Button>
          </>
        }>
        <div
          style={{
            width: '1080px',
            maxWidth: '90vw',
          }}>
          <TextArea value={selectedText} readonly style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
        </div>
      </Dialog>
    </div>
  );
}
