import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_NAME, WIDGET_ACTIONS, buildScheduleWidget } from './schedule-widget';
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

  // Нажатие на ‹/› внутри виджета: переключение сегодня↔завтра
  if (widgetAction === 'WIDGET_CLICK') {
    const action = props.clickAction;

    if (action === WIDGET_ACTIONS.SHOW_TOMORROW) {
      storage.set(WIDGET_MODE_KEY, 1);
    } else if (action === WIDGET_ACTIONS.SHOW_TODAY) {
      storage.set(WIDGET_MODE_KEY, 0);
    }
    // другие действия (OPEN_APP) обрабатываются системой — открытие приложения

    // немедленный рендер в новом режиме из кеша (полный день перезагрузка не нужна)
    const mode = storage.get<number>(WIDGET_MODE_KEY, 0) as 0 | 1;
    const data = await loadWidgetData(true);
    renderWidget(buildScheduleWidget(data, mode));
    return;
  }

  // 1) мгновенный рендер из кеша — stamый последний сохранённый mode
  const mode = storage.get<number>(WIDGET_MODE_KEY, 0) as 0 | 1;
  try {
    const cached = await loadWidgetData(true);
    renderWidget(buildScheduleWidget(cached, mode));
  } catch {
    return;
  }

  // 2) свежие данные из сети (кроме WIDGET_ADDED — там и кеша достаточно)
  if (widgetAction !== 'WIDGET_ADDED') {
    try {
      const fresh = await loadWidgetData(false);
      renderWidget(buildScheduleWidget(fresh, mode));
    } catch {
      // офлайн — останется кеш
    }
  }
}

export default widgetTaskHandler;
