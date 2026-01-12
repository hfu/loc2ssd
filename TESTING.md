# Testing Guide

このドキュメントは、loc2ssdの動作確認方法を説明します。

## 前提条件

本ツールは外部のベクトルタイルサーバー (`https://tunnel.optgeo.org/martin/protomaps-basemap/`) にアクセスするため、インターネット接続が必要です。

## 動作確認手順

### 1. Node.jsを使用する場合

```bash
# 依存関係をインストール
npm install

# 東京駅周辺の記述を生成
node main.mjs 139.7671 35.6812 14

# 出力をファイルに保存
node main.mjs 139.7671 35.6812 14 > tokyo_station.md
```

### 2. Denoを使用する場合

```bash
# 東京駅周辺の記述を生成
deno run --allow-net main.ts 139.7671 35.6812 14

# 出力をファイルに保存
deno run --allow-net main.ts 139.7671 35.6812 14 > tokyo_station.md
```

### 3. Justfileを使用する場合

```bash
# 東京駅
just run-tokyo

# 渋谷駅
just run-shibuya

# ニューヨーク (タイムズスクエア)
just run-ny

# ロンドン (ビッグベン)
just run-london

# カスタム座標
just run <lon> <lat> [zoom]
```

## 期待される出力

正常に動作した場合、以下のようなMarkdown形式の出力が得られます：

```markdown
# Subjective Spatial Description

**Location**: 35.681200, 139.767100
**Zoom Level**: 14

## Spatial Features by Direction

**[N]** 45m: commercial, retail | 28+ bldgs in 100m
**[NE]** 89m: commercial | 22+ bldgs in 100m
...

## Summary

- Total features: 456
- Buildings: 389
- Landuse features: 67
```

## トラブルシューティング

### ネットワークエラー

```
Error fetching tile 14/14551/6450: fetch failed
```

このエラーは、以下の原因が考えられます：

1. インターネット接続がない
2. ファイアウォールやプロキシがアクセスをブロックしている
3. ベクトルタイルサーバーが一時的にダウンしている

解決方法：
- インターネット接続を確認
- ファイアウォール設定を確認
- 別のネットワークで試す

### 特徴が見つからない

```
Extracted 0 features
```

このエラーは、以下の原因が考えられます：

1. 指定した座標にデータが存在しない（海洋など）
2. ズームレベルが適切でない
3. ベクトルタイルにlanduse/buildingレイヤーが含まれていない

解決方法：
- 陸地の座標を指定する
- ズームレベルを調整する（デフォルトは14）
- 別のベクトルタイルソースを使用する場合は、コード内の`TILE_BASE_URL`を変更

## テスト座標例

| 場所 | 経度 | 緯度 | 説明 |
|------|------|------|------|
| 東京駅 | 139.7671 | 35.6812 | 都心部、高密度 |
| 渋谷駅 | 139.7016 | 35.6598 | 商業地域 |
| 皇居 | 139.7528 | 35.6852 | 緑地、低密度 |
| タイムズスクエア | -73.9855 | 40.7580 | ニューヨーク |
| ビッグベン | -0.1246 | 51.5007 | ロンドン |

## コードの検証

### 構文チェック

```bash
# Node.js
node --check main.mjs

# Deno
deno check main.ts
```

### 依存関係の確認

```bash
# Node.js
npm list

# Deno
deno info main.ts
```

## パフォーマンス

- **タイル数**: 9タイル（3×3グリッド）
- **処理時間**: 通常1-3秒（ネットワーク速度に依存）
- **特徴数**: 通常100-1000個（都市部の場合）

## セキュリティ

CodeQL分析により、セキュリティ脆弱性は検出されていません。

## サポート

問題が発生した場合は、GitHubのIssueで報告してください。
