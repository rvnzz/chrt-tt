import { FlexWidget, TextWidget } from 'react-native-android-widget';

export const WIDGET_NAME = 'Schedule';

export type WidgetPair = {
  n: number;
  subject: string;
  teacher: string;
  room: string;
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

/** Строит дерево виджета: две колонки — сегодня и завтра. */
export function buildScheduleWidget(data: WidgetData): FlexWidgetRepresentation {
  const days = data?.days?.length ? data.days : [null, null];

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        justifyContent: 'space-between',
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#121417',
        borderRadius: 16,
        padding: 8,
        flexDirection: 'row',
      }}>
      {days.map((day: WidgetDay | null, index: number) => (
        <FlexWidget
          key={index}
          style={{
            flex: 1,
            height: 'match_parent',
            backgroundColor: '#1C2024',
            borderRadius: 10,
            padding: 6,
            flexDirection: 'column',
          }}>
          <TextWidget
            text={(day?.label ?? '—').toUpperCase()}
            style={{ fontSize: 11, color: '#60A0FA', marginBottom: 6 }}
          />

          {day && day.pairs.length > 0 ? (
            day.pairs
              .slice(0, 5)
              .map((pair, index) => {
                const prefix = pair.isSplit && pair.subgroup ? `${pair.subgroup}·` : '';
                return (
                  <FlexWidget
                    key={`${pair.n}-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}>
                    <TextWidget
                      text={pair.start}
                      style={{
                        fontSize: 10,
                        color: '#9AE6B4',
                        width: 34,
                      }}
                    />
                    <TextWidget
                      text={`${prefix}${pair.subject.slice(0, 40)}${
                        pair.subject.length > 40 ? '…' : ''
                      }`}
                      style={{
                        fontSize: 10,
                        color: '#EAEAEA',
                      }}
                    />
                  </FlexWidget>
                );
              })
          ) : (
            <TextWidget
              text={day?.published === false ? 'Не опубликовано' : 'Занятий нет'}
              style={{ fontSize: 11, color: '#808A94' }}
            />
          )}

          {day && day.pairs.length > 5 && (
            <TextWidget
              text={`+${day.pairs.length - 5} ещё…`}
              style={{ fontSize: 10, color: '#808A94' }}
            />
          )}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
