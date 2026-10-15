import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const WIDGET_NAME = 'Schedule';

export type WidgetPair = {
  n: number;
  subject: string;
  teacher: string;
  room: string;
  group_name?: string;
  subgroup: number | null;
  isSplit: boolean;
  start: string;
  end: string;
};

export type WidgetDay = {
  date: string;
  label: string;
  published: boolean;
  pairs: WidgetPair[];
};

export type WidgetData = {
  days: WidgetDay[];
};

type FlexWidgetRepresentation = import('react-native-android-widget').WidgetRepresentation;

/**
 * Строит дерево виджета.
 * Режим управляется кнопкой-переключателем в шапке (‹ → сегодня/завтра → ›):
 *   clickActionData = { „mode”: 'today' | 'tomorrow' } → хендлер перекладывает
 * выбранный день в полный рендер.
 */
export function buildScheduleWidget(
  data: WidgetData,
  shownDay: 0 | 1 = 0,
): FlexWidgetRepresentation {
  const day = data?.days?.[shownDay] ?? null;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#121417',
        borderRadius: 16,
        padding: 8,
        flexDirection: 'column',
      }}>
      {/* Шапка: заголовок дня + кнопки ‹ › */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}>
        {/* Кнопка «назад» (в виден только в режиме «завтра») */}
        {shownDay === 1 ? (
          <TextWidget
            text="‹"
            clickAction="SHOW_TODAY"
            style={{
              fontSize: 16,
              color: '#60A0FA',
              paddingHorizontal: 10,
              paddingVertical: 2,
            }}
          />
        ) : (
          <ViewWidgetSpacer width={16} />
        )}

        <TextWidget
          text={(day?.label ?? '—').toUpperCase()}
          style={{ fontSize: 11, color: '#60A0FA' }}
        />

        {/* Кнопка «вперёд» (виден только в состоянии «сегодня») */}
        {shownDay === 0 ? (
          <TextWidget
            text="›"
            clickAction="SHOW_TOMORROW"
            style={{
              fontSize: 16,
              color: '#60A0FA',
              paddingHorizontal: 10,
              paddingVertical: 2,
            }}
          />
        ) : (
          <ViewWidgetSpacer width={16} />
        )}
      </FlexWidget>

      {/* Список пар */}
      {day && day.pairs.length > 0 ? (
        day.pairs.slice(0, 6).map((pair, index) => (
          <FlexWidget
            key={`${pair.n}-${index}`}
            style={{
              flexDirection: 'column',
              marginBottom: 6,
              backgroundColor: '#1C2024',
              borderRadius: 8,
              paddingVertical: 3,
              paddingHorizontal: 6,
            }}>
            {/* Строка 1: № · время · предмет · кабинет */}
            <FlexWidget
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <TextWidget
                text={String(pair.n)}
                style={{
                  fontSize: 11,
                  color: '#60A0FA',
                  width: 14,
                }}
              />
              <TextWidget
                text={`${pair.start}–${pair.end}`}
                style={{
                  fontSize: 10,
                  color: '#9AE6B4',
                  width: 74,
                }}
              />
              <TextWidget
                text={truncate(pair.subject, 24)}
                style={{
                  fontSize: 10,
                  color: '#EAEAEA',
                }}
              />
              <TextWidget
                text={pair.room}
                style={{
                  fontSize: 10,
                  color: '#9AE6B4',
                }}
              />
            </FlexWidget>

            {/* Строка 2: преподаватель / группа */}
            <TextWidget
              text={truncate(pair.teacher || pair.group_name || '', 44)}
              style={{
                fontSize: 9,
                color: '#8A929B',
                marginTop: 1,
                marginLeft: 14,
              }}
            />
          </FlexWidget>
        ))
      ) : (
        <FlexWidget style={{ paddingVertical: 4 }}>
          <TextWidget
            text={day?.published === false ? 'Не опубликовано' : 'Занятий нет'}
            style={{ fontSize: 11, color: '#808A94' }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

/** Кликабельные действия виджетa (обнаруживается в widgetTaskHandler-е WIDGET_CLICK) */
export const WIDGET_ACTIONS = {
  SHOW_TOMORROW: 'SHOW_TOMORROW',
  SHOW_TODAY: 'SHOW_TODAY',
} as const;

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Пустой виджет-заполнитель (пока данные не загрузились) */
export function ScheduleWidgetPlaceholder() {
  return buildScheduleWidget({
    days: [
      { date: '', label: 'СЕГОДНЯ', published: false, pairs: [] },
      { date: '', label: 'ЗАВТРА', published: false, pairs: [] },
    ],
  });
}

/** Спорный ViewWidgetSpacer — отсутствует в библиотеке, заменяем пустым FlexWidget */
function ViewWidgetSpacer({ width }: { width: number }) {
  return (
    <FlexWidget
      style={{
        width,
        height: 18,
      }}
    />
  );
}
