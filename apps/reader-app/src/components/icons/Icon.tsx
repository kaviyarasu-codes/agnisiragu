// src/components/icons/Icon.tsx
// Consolidated line-icon set, redrawn from the paths in
// Agnisiragu Reader.dc.html so every screen shares one icon source instead
// of scattering emoji or one-off inline SVG. All icons are stroke-based
// (matching the design's outline style) unless noted "filled".
//
// Usage: <Icon name="menu" size={18} color={t.ink} />

import React from 'react';
import Svg, { Path, Line, Circle, Polyline, Rect, Polygon } from 'react-native-svg';

export type IconName =
  | 'menu' | 'search' | 'bell' | 'back' | 'close' | 'more'
  | 'like' | 'comment' | 'share' | 'bookmarkNav' | 'bookmarkLarge'
  | 'calendar' | 'chevronDown' | 'chevronRight'
  | 'warningTriangle' | 'offlineCircle' | 'permissionBell'
  | 'jobsBriefcase' | 'archiveBox' | 'postPlus' | 'reportFlag'
  | 'downloadImage' | 'downloadVideo' | 'check' | 'play'
  | 'home' | 'grid';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, color = '#1C1917', strokeWidth }: IconProps) {
  const sw = strokeWidth ?? 1.6;
  const common = { fill: 'none' as const, stroke: color, strokeWidth: sw };

  switch (name) {
    case 'menu':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Rect y={2.5} width={17} height={1.6} fill={color} />
          <Rect y={7.7} width={17} height={1.6} fill={color} />
          <Rect y={12.9} width={12} height={1.6} fill={color} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={6.6} cy={6.6} r={5.2} {...common} />
          <Line x1={10.4} y1={10.4} x2={15} y2={15} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M3 12.5V7a5 5 0 0 1 10 0v5.5" {...common} />
          <Line x1={1.5} y1={12.5} x2={14.5} y2={12.5} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Polyline points="10,2 3.5,8.5 10,15" {...common} strokeWidth={1.8} />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 15 15">
          <Line x1={1} y1={1} x2={14} y2={14} stroke={color} strokeWidth={1.8} />
          <Line x1={14} y1={1} x2={1} y2={14} stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'more':
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Circle cx={9} cy={4} r={1.6} fill={color} />
          <Circle cx={9} cy={9} r={1.6} fill={color} />
          <Circle cx={9} cy={14} r={1.6} fill={color} />
        </Svg>
      );
    case 'like':
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Circle cx={9} cy={9} r={7.4} {...common} />
          <Polyline points="5.6,9.4 9,6 12.4,9.4" {...common} />
          <Line x1={9} y1={6} x2={9} y2={12.6} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'comment':
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Rect x={1.5} y={3} width={15} height={10} rx={2.5} {...common} />
          <Polyline points="5,13 5,16 8.5,13" {...common} />
        </Svg>
      );
    case 'share':
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Polyline points="2,10 9,3 16,10" {...common} />
          <Line x1={9} y1={3} x2={9} y2={15} stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'bookmarkNav':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Polyline points="3.5,1.8 13.5,1.8 13.5,15 8.5,11 3.5,15" {...common} strokeWidth={1.5} />
        </Svg>
      );
    case 'bookmarkLarge':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Polyline points="14,6 34,6 34,42 24,32 14,42" {...common} strokeWidth={2} />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 14 14">
          <Rect x={1} y={2.5} width={12} height={10.5} rx={1.4} {...common} strokeWidth={1.4} />
          <Line x1={1} y1={6} x2={13} y2={6} stroke={color} strokeWidth={1.4} />
          <Line x1={4.2} y1={1} x2={4.2} y2={3.4} stroke={color} strokeWidth={1.4} />
          <Line x1={9.8} y1={1} x2={9.8} y2={3.4} stroke={color} strokeWidth={1.4} />
        </Svg>
      );
    case 'chevronDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 10 10">
          <Polyline points="1,3 5,7 9,3" {...common} strokeWidth={1.6} />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 10 10">
          <Polyline points="3,1 7,5 3,9" {...common} strokeWidth={1.6} />
        </Svg>
      );
    case 'warningTriangle':
      return (
        <Svg width={size} height={size} viewBox="0 0 52 52">
          <Polygon points="26,6 48,44 4,44" {...common} strokeWidth={2} />
          <Line x1={26} y1={20} x2={26} y2={32} stroke={color} strokeWidth={2} />
          <Circle cx={26} cy={37} r={1.6} fill={color} />
        </Svg>
      );
    case 'offlineCircle':
      return (
        <Svg width={size} height={size} viewBox="0 0 54 54">
          <Circle cx={27} cy={27} r={24} fill="none" stroke="#DDD8D0" strokeWidth={2} />
          <Line x1={14} y1={40} x2={40} y2={14} stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'permissionBell':
      return (
        <Svg width={size} height={size} viewBox="0 0 46 46">
          <Path d="M11 33V20a12 12 0 0 1 24 0v13" {...common} strokeWidth={2} />
          <Line x1={7} y1={33} x2={39} y2={33} stroke={color} strokeWidth={2} />
          <Circle cx={23} cy={38} r={3} fill="none" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'jobsBriefcase':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Rect x={1} y={4.5} width={15} height={10.5} rx={1.6} {...common} strokeWidth={1.5} />
          <Path d="M6 4.5V2.8h5v1.7" {...common} strokeWidth={1.5} />
        </Svg>
      );
    case 'archiveBox':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Rect x={1} y={2.5} width={15} height={4} rx={1} {...common} strokeWidth={1.5} />
          <Rect x={2.6} y={6.5} width={11.8} height={8.5} rx={1} {...common} strokeWidth={1.5} />
          <Line x1={6.6} y1={10.2} x2={10.4} y2={10.2} stroke={color} strokeWidth={1.5} />
        </Svg>
      );
    case 'postPlus':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Rect x={1} y={1} width={15} height={15} rx={4} fill={color} />
          <Line x1={8.5} y1={5} x2={8.5} y2={12} stroke="#fff" strokeWidth={1.7} />
          <Line x1={5} y1={8.5} x2={12} y2={8.5} stroke="#fff" strokeWidth={1.7} />
        </Svg>
      );
    case 'reportFlag':
      return (
        <Svg width={size} height={size} viewBox="0 0 21 21">
          <Polygon points="10.5,2.5 20,18.5 1,18.5" {...common} strokeWidth={1.5} />
          <Line x1={10.5} y1={8} x2={10.5} y2={13} stroke={color} strokeWidth={1.5} />
          <Circle cx={10.5} cy={15.8} r={0.9} fill={color} />
        </Svg>
      );
    case 'downloadImage':
      return (
        <Svg width={size} height={size} viewBox="0 0 21 21">
          <Line x1={10.5} y1={2.5} x2={10.5} y2={13} stroke={color} strokeWidth={1.5} />
          <Polyline points="5.5,8.5 10.5,13.5 15.5,8.5" {...common} strokeWidth={1.5} />
          <Line x1={3} y1={18} x2={18} y2={18} stroke={color} strokeWidth={1.5} />
        </Svg>
      );
    case 'downloadVideo':
      return (
        <Svg width={size} height={size} viewBox="0 0 21 21">
          <Rect x={1.5} y={3} width={13} height={9} rx={1.6} {...common} strokeWidth={1.5} />
          <Polygon points="16,5.5 19.5,3.5 19.5,11.5 16,9.5" {...common} strokeWidth={1.5} />
          <Line x1={3} y1={18} x2={18} y2={18} stroke={color} strokeWidth={1.5} />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="2,8.5 6.2,13 14,3" {...common} strokeWidth={2} />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polygon points="4,2 14,8 4,14" fill={color} />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Polyline points="2,9 9,2.5 16,9" {...common} strokeWidth={1.6} />
          <Path d="M4 8v7.5h10V8" {...common} strokeWidth={1.6} />
          <Line x1={7} y1={15.5} x2={7} y2={11} stroke={color} strokeWidth={1.6} />
          <Line x1={11} y1={15.5} x2={11} y2={11} stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'grid':
      return (
        <Svg width={size} height={size} viewBox="0 0 17 17">
          <Rect x={1} y={1} width={6.5} height={6.5} rx={1.3} {...common} strokeWidth={1.5} />
          <Rect x={9.5} y={1} width={6.5} height={6.5} rx={1.3} {...common} strokeWidth={1.5} />
          <Rect x={1} y={9.5} width={6.5} height={6.5} rx={1.3} {...common} strokeWidth={1.5} />
          <Rect x={9.5} y={9.5} width={6.5} height={6.5} rx={1.3} {...common} strokeWidth={1.5} />
        </Svg>
      );
    default:
      return null;
  }
}
