import { requestWidgetUpdate } from 'react-native-android-widget';

import { WIDGET_NAME, buildScheduleWidget } from './schedule-widget';
import { loadWidgetData } from './widget-data';
import { storage } from '@/utils/storage';

/**
 * Обновление виджета из приложения (пока оно живо):
 * тянет свежие данные и рендерит. Вызывается при входе на «Расписание»
 * и после настроек/обновлений расписания.
 */
export async function refreshScheduleWidget(): Promise<void> {
  try {
    const data = await loadWidgetData(false);

    const mode = (storage.get('widget.shownDay', 0) as 0 | 1);

    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => buildScheduleWidget(data, mode),
      widgetNotFound: () => undefined, // виджет не добавлен — ок
    });
  } catch (error) {
    console.warn('[widget] обновление не удалось:', error);
  }
}
