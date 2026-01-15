import { createMenuItems, useViewConfig } from '@vaadin/hilla-file-router/runtime.js';
import { effect, signal } from '@vaadin/hilla-react-signals';
import { AppLayout, DrawerToggle, Icon, SideNav, SideNavItem, Button, Select } from '@vaadin/react-components';
import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { EndpointService } from 'Frontend/generated/endpoints';
import type LocaleInfo from 'Frontend/generated/com/github/laplusijns/LocaleInfo.js';
import { i18n, key, translate } from '@vaadin/hilla-react-i18n';
// Document title signal
const documentTitleSignal = signal('');
const LOCALE_STORAGE_KEY = 'language';
const savedTheme = localStorage.getItem('darkMode');
const darkModeSignal = signal(savedTheme === 'true');
effect(() => {
  document.title = i18n.translateDynamic(documentTitleSignal.value).value;
  document.documentElement.setAttribute('theme', darkModeSignal.value ? 'dark' : 'light');
  localStorage.setItem('darkMode', darkModeSignal.value ? 'true' : 'false');
});
(globalThis as any).Vaadin.documentTitleSignal = documentTitleSignal;

export default function MainLayout() {
  const currentTitle = useViewConfig()?.title;
  const navigate = useNavigate();
  const location = useLocation();

  const [localeItems, setLocaleItems] = useState<{ label: string; value: string }[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string>();
  const [initialized, setInitialized] = useState(false);

  // 初始化主題，優先使用 localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    darkModeSignal.value = savedTheme === 'true';

    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) ?? '';

    EndpointService.locales().then((localInfos: LocaleInfo[]) => {
      const items = localInfos.map((locale) => ({
        label: locale.name, // 顯示名稱
        value: locale.code, // 代號
      }));
      items.unshift({ label: '', value: '' });
      setLocaleItems(items);
      // 預設選第一個（可選）
      const defaultLocale = items.find((i) => i.value === savedLocale)?.value ?? items[0].value;
      setSelectedLocale(defaultLocale);
    });
  }, []);

  // 更新 document title
  useEffect(() => {
    if (currentTitle) {
      documentTitleSignal.value = currentTitle;
    }
  }, [currentTitle]);

  const toggleDarkMode = () => {
    darkModeSignal.value = !darkModeSignal.value;
  };
  const onLocaleChange = (e: CustomEvent) => {
    if (!initialized) {
      setInitialized(true);
      return; // 跳過第一次觸發
    }

    const value = e.detail.value as string;

    setSelectedLocale(value);
    i18n.setLanguage(value);
    localStorage.setItem(LOCALE_STORAGE_KEY, value);
  };

  return (
    <AppLayout primarySection="drawer">
      {/* Drawer */}
      <div slot="drawer" className="flex flex-col justify-between h-full p-m">
        <header className="flex flex-col gap-m">
          <span className="font-semibold text-l">jocb</span>
          <div>
            <Button theme="contrast" onClick={toggleDarkMode}>
              <Icon src={darkModeSignal.value ? 'line-awesome/svg/sun-solid.svg' : 'line-awesome/svg/moon-solid.svg'} />
              {darkModeSignal.value ? translate(key`btn.swtich.light`) : translate(key`btn.swtich.dark`)}
            </Button>
            <Select label="Language" items={localeItems} onValueChanged={onLocaleChange} value={selectedLocale} />
          </div>
          <SideNav onNavigate={({ path }) => navigate(path!)} location={location}>
            {createMenuItems().map(({ to, title, icon }) => (
              <SideNavItem path={to.substring(1)} key={to}>
                {icon ? <Icon src={icon} slot="prefix" /> : <></>}
                {i18n.translateDynamic(title)}
              </SideNavItem>
            ))}
          </SideNav>
        </header>
      </div>

      {/* Navbar */}
      <DrawerToggle slot="navbar" aria-label="Menu toggle"></DrawerToggle>
      <h1 slot="navbar" className="text-l m-0">
        {i18n.translateDynamic(documentTitleSignal.value)}
      </h1>

      {/* Main content */}
      <Suspense>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}
