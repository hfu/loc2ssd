# loc2ssd

Location to Subjective Spatial Description

**loc2ssd** は、現在地（経度/緯度）から周辺のベクトルタイルを取得し、LLM用の主観的空間記述（Subjective Spatial Description）を生成するDenoツールです。

## Features

- 🗺️ 現在地周辺の9タイル（3×3グリッド）を自動取得
- 🧭 16方位（N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW）で方向を表現
- 📏 現在地からの距離を計算
- 🏗️ 建物密度と土地利用情報を要約
- 📝 Markdown形式で読みやすい出力

## Requirements

- [Deno](https://deno.land/) v1.x以上 **または** [Node.js](https://nodejs.org/) v18.x以上

## Installation

```bash
git clone https://github.com/hfu/loc2ssd.git
cd loc2ssd

# Node.jsを使用する場合
npm install
```

## Usage

### Basic Usage

**Denoを使用する場合:**
```bash
# 経度・緯度を指定して実行
deno run --allow-net main.ts <longitude> <latitude> [zoom]
```

**Node.jsを使用する場合:**
```bash
# 経度・緯度を指定して実行
node main.mjs <longitude> <latitude> [zoom]
```

### Examples

**Denoの場合:**
```bash
# 東京駅周辺の記述を生成
deno run --allow-net main.ts 139.7671 35.6812

# ズームレベルを指定（デフォルトは14）
deno run --allow-net main.ts 139.7671 35.6812 15

# 渋谷駅周辺
deno run --allow-net main.ts 139.7016 35.6598
```

**Node.jsの場合:**
```bash
# 東京駅周辺の記述を生成
node main.mjs 139.7671 35.6812

# ズームレベルを指定（デフォルトは14）
node main.mjs 139.7671 35.6812 15

# 渋谷駅周辺
node main.mjs 139.7016 35.6598
```

### Using Justfile

プロジェクトには便利な実行パターンを記録したJustfileが含まれています：

```bash
# 利用可能なコマンドを表示
just --list

# Node.jsの依存関係をインストール
just install

# 東京駅で実行
just run-tokyo

# カスタム座標で実行
just run 139.7671 35.6812

# 結果をファイルに保存
just run-save 139.7671 35.6812 14 output.md

# コードフォーマット (Deno)
just fmt

# コードチェック (Deno)
just check
```

## Output Format

プログラムは以下のような形式でMarkdownを出力します（詳細は[EXAMPLE.md](EXAMPLE.md)を参照）：

```markdown
# Subjective Spatial Description

**Location**: 35.681200, 139.767100
**Zoom Level**: 14

## Spatial Features by Direction

**[N]** 50m: residential, commercial | 25+ bldgs in 100m
**[NE]** 120m: park | 5 bldgs ~200m
**[E]** 80m: retail | 30+ bldgs in 100m
**[SE]** 150m: industrial | 15+ bldgs in 100m
...

## Summary

- Total features: 456
- Buildings: 389
- Landuse features: 67
```

## How It Works

1. **タイル計算**: @mapbox/tilebeltを使用して、現在地を中心とする9つのベクトルタイルのIDを計算
2. **タイル取得**: protomaps-basemapから各タイルをフェッチ
3. **パース**: @mapbox/vector-tileでベクトルタイルをパース
4. **地物抽出**: landuse（土地利用）とbuilding（建物）レイヤーから地物を抽出
5. **方位計算**: 各地物の現在地からの方位を16方位で算出
6. **距離計算**: Haversine公式を使用して距離を計算
7. **集約**: 方位ごとに地物を集約し、建物密度などを算出
8. **出力**: Markdown形式で結果を出力

## Data Source

ベクトルタイルのデフォルトソース:
- URL: `https://tunnel.optgeo.org/martin/protomaps-basemap/{z}/{x}/{y}`
- デフォルトズームレベル: 14

## Dependencies

- `npm:@mapbox/tilebelt` - タイル座標計算
- `npm:@mapbox/vector-tile` - ベクトルタイルパース
- `npm:pbf` - Protocol Bufferデコーディング

## Development

```bash
# Node.jsの場合
npm install

# 依存関係をキャッシュ (Deno)
just cache

# コードフォーマット (Deno)
just fmt

# 型チェック (Deno)
just check
```

## Testing

詳細なテスト手順については、[TESTING.md](TESTING.md)を参照してください。

## License

See [LICENSE](LICENSE) file for details.

## Author

hfu
