# 出力例 (Example Output)

このファイルは、loc2ssdが生成する出力の例を示します。

## 東京駅周辺 (Tokyo Station Area)
座標: 139.7671, 35.6812

```markdown
# Subjective Spatial Description

**Location**: 35.681200, 139.767100
**Zoom Level**: 14

## Spatial Features by Direction

**[N]** 45m: commercial, retail | 28+ bldgs in 100m
**[NNE]** 120m: residential | 15+ bldgs in 100m
**[NE]** 89m: commercial | 22+ bldgs in 100m
**[ENE]** 156m: park, green_space | 3 bldgs ~300m
**[E]** 67m: commercial, office | 35+ bldgs in 100m
**[ESE]** 98m: retail | 18+ bldgs in 100m
**[SE]** 134m: residential, commercial | 12+ bldgs in 100m
**[SSE]** 201m: industrial | 8 bldgs ~250m
**[S]** 78m: commercial | 25+ bldgs in 100m
**[SSW]** 112m: residential | 14+ bldgs in 100m
**[SW]** 145m: mixed_use | 10+ bldgs in 100m
**[WSW]** 167m: commercial, retail | 9 bldgs ~200m
**[W]** 56m: commercial, office | 32+ bldgs in 100m
**[WNW]** 189m: park | 5 bldgs ~350m
**[NW]** 92m: residential | 19+ bldgs in 100m
**[NNW]** 123m: commercial | 16+ bldgs in 100m

## Summary

- Total features: 456
- Buildings: 389
- Landuse features: 67
```

## 使い方

実際のデータを取得するには:

```bash
# Node.js
node main.mjs 139.7671 35.6812 14 > tokyo_station.md

# Deno
deno run --allow-net main.ts 139.7671 35.6812 14 > tokyo_station.md
```

## 出力フォーマットの説明

- **方位**: 16方位で表現（N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW）
- **距離**: 最も近い特徴までの距離をメートル単位で表示（1km以上の場合はkm単位）
- **土地利用**: landuse情報（commercial, residential, park, industrial等）
- **建物密度**: 100m以内の建物数、または平均距離

このフォーマットは、LLMが空間情報を理解しやすいように設計されています。
