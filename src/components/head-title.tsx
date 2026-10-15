import Head from 'expo-router/head';

/**
 * Заголовок страницы браузера (только web; на native — no-op).
 * Статический экспорт пишет <title> в prerender-HTML.
 */
export function HeadTitle({ title, description }: { title: string; description?: string }) {
  if (process.env.EXPO_OS !== 'web') return null;

  return (
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      {description && <meta name="description" content={description} />}
      <meta name="theme-color" content="#121417" />
    </Head>
  );
}
