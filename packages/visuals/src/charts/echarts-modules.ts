import { use } from "echarts/core";
import {
  BarChart,
  BoxplotChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  SunburstChart,
  TreemapChart
} from "echarts/charts";
import {
  AriaComponent,
  CalendarComponent,
  DatasetComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
  VisualMapComponent
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

let registered = false;

export function registerDeckoryEChartsModules(): void {
  if (registered) return;
  use([
    BarChart,
    BoxplotChart,
    CustomChart,
    FunnelChart,
    GaugeChart,
    HeatmapChart,
    LineChart,
    MapChart,
    PieChart,
    RadarChart,
    SankeyChart,
    ScatterChart,
    SunburstChart,
    TreemapChart,
    AriaComponent,
    CalendarComponent,
    DatasetComponent,
    GeoComponent,
    GridComponent,
    LegendComponent,
    MarkLineComponent,
    RadarComponent,
    TitleComponent,
    TooltipComponent,
    TransformComponent,
    VisualMapComponent,
    SVGRenderer
  ]);
  registered = true;
}
