import Head from 'expo-router/head';
import { useEffect } from 'react';

/**
 * Заголовок страницы браузера (только web; на native — no-op).
 * Статический экспорт пишет <title> в prerender-HTML.
 * На web дополнительно пушит page_view в dataLayer (GTM) при смене маршрута.
 */
export function HeadTitle({ title, description }: { title: string; description?: string }) {
  if (process.env.EXPO_OS !== 'web') return null;

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <DataLayerPush title={title} />
    </>
  );
}

function DataLayerPush({ title }: { title: string }) {
  useEffect(() => {
    const w = window as typeof window & { dataLayer?: unknown[] };
    if (!w.dataLayer) return;

    w.dataLayer.push({
      event: 'page_view',
      page_title: title,
      page_path: window.location.pathname,
    });
  }, [title]);

  return null;
}
