import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_NAME, WIDGET_ACTIONS, buildScheduleWidget, ScheduleWidgetPlaceholder } from './schedule-widget';
import { loadWidgetData } from './widget-data';
import { storage } from '@/utils/storage';

const WIDGET_MODE_KEY = 'widget.shownDay'; // 0 = сегодня, 1 = завтра

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetName = props.widgetInfo.widgetName;
  const widgetAction = props.widgetAction;
  const renderWidget = props.renderWidget;

  if (widgetName !== WIDGET_NAME) {
    return;
  }

  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  const shownDay = (storage.get<number>(WIDGET_MODE_KEY, 0) as 0 | 1) ?? 0;

  // 1) ГАРАНТИРОВАННЫЙ первый рендер (синхронный, без ожиданий) —
  //    иначе виджет остаётся прозрачным
  try {
    renderWidget(ScheduleWidgetPlaceholder());
  } catch (error) {
    console.warn('[widget] placeholder render failed:', error);
  }

  // 2) Рендер из кеша
  try {
    const cached = await loadWidgetData(true);
    renderWidget(buildScheduleWidget(cached, shownDay));
  } catch (error) {
    console.warn('[widget] cache render failed:', error);
  }

  // 3) Нажатие ‹/› внутри виджета — только перерисовка в другом режиме (из кеша)
  if (widgetAction === 'WIDGET_CLICK') {
    const action = props.clickAction;

    if (action === WIDGET_ACTIONS.SHOW_TOMORROW) {
      storage.set(WIDGET_MODE_KEY, 1);
      try {
        const data = await loadWidgetData(true);
        renderWidget(buildScheduleWidget(data, 1));
      } catch (error) {
        console.warn('[widget] tomorrow render failed:', error);
      }
    } else if (action === WIDGET_ACTIONS.SHOW_TODAY) {
      storage.set(WIDGET_MODE_KEY, 0);
      try {
        const data = await loadWidgetData(true);
        renderWidget(buildScheduleWidget(data, 0));
      } catch (error) {
        console.warn('[widget] today render failed:', error);
      }
    }
    // WIDGET_CLICK не требует повторного рендера в других случаях
    return;
  }

  // 4) Свежие данные из сети (WIDGET_ADDED может пропустить — сеть чуть позже)
  try {
    const fresh = await loadWidgetData(false);
    renderWidget(buildScheduleWidget(fresh, shownDay));
  } catch (error) {
    console.warn('[widget] fresh render failed:', error);
  }
}

export default widgetTaskHandler;
