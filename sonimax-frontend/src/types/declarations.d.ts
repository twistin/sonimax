// Type declarations to resolve library conflicts

declare module 'recharts' {
  export const BarChart: any;
  export const Bar: any;
  export const XAxis: any;
  export const YAxis: any;
  export const Tooltip: any;
  export const Legend: any;
  export const PieChart: any;
  export const Pie: any;
  export const Cell: any;
  export const ResponsiveContainer: any;
  export const CartesianGrid: any;
}

declare module '@react-google-maps/api' {
  export const useJsApiLoader: any;
  export const useLoadScript: any;
  export const GoogleMap: any;
  export const Marker: any;
  export const InfoWindow: any;
  export const Polyline: any;
  export const DirectionsService: any;
  export const DirectionsRenderer: any;
}
