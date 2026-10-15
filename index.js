/**
 * Root entry: основной Expo Router + Android-виджет хендлер.
 * `package.json main` указывает на этот файл,
 * react-native-android-widget грузит его, когда системе надо отрендерить виджет.
 */
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
