import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { WIDGET_NAME, buildScheduleWidget } from './schedule-widget';
import { loadWidgetData } from './widget-data';

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

  // 1) мгновенный рендер из кеша (снимок последнего обновления)
  try {
    const cached = await loadWidgetData(true);
    renderWidget(buildScheduleWidget(cached));
  } catch {
    return;
  }

  // 2) не только на добавление: обнови данные с сети и перерисови
  if (widgetAction !== 'WIDGET_ADDED') {
    try {
      const fresh = await loadWidgetData(false);
      renderWidget(buildScheduleWidget(fresh));
    } catch {
      // офлайн — останется кеш
    }
  }
}

export default widgetTaskHandler;
