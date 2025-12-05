# アルゴリズム選択ガイド

このガイドでは、fuzzy
searchライブラリが提供する4つのアルゴリズムの特性と、用途に応じた選び方を説明します。

## クイックリファレンス

| 用途                                     | 推奨アルゴリズム      | 設定例                             |
| ---------------------------------------- | --------------------- | ---------------------------------- |
| **汎用検索（デフォルト）**               | `levenshtein`         | `algorithm: "levenshtein"`         |
| **タイプミス補正（隣接文字の入れ替え）** | `damerau-levenshtein` | `algorithm: "damerau-levenshtein"` |
| **部分一致・サブストリング検索**         | `smith-waterman`      | `algorithm: "smith-waterman"`      |
| **人名・地名検索**                       | `jaro-winkler`        | `algorithm: "jaro-winkler"`        |
| **類似長文字列の比較**                   | `needleman-wunsch`    | `algorithm: "needleman-wunsch"`    |
| **固定長コード（超高速）**               | `hamming`             | `algorithm: "hamming"`             |

---

## アルゴリズム詳細

### 1. Levenshtein距離（デフォルト）

**特徴**:

- 標準的な編集距離アルゴリズム
- 挿入・削除・置換の3つの操作で文字列間の距離を測定
- バランスの取れた性能

**得意な処理**:

- 一般的なタイプミス補正
- 文字の追加・削除ミスの検出
- 汎用的なfuzzy search

**使用例**:

```typescript
const search = new FuzzySearch<Product>(["name"], {
  algorithm: "levenshtein",
});

search.search("Aple"); // "Apple"を検出（1文字の削除）
search.search("Bananaa"); // "Banana"を検出（1文字の追加）
search.search("Ornge"); // "Orange"を検出（1文字の置換）
```

**計算量**: O(mn)（m, nは文字列の長さ）\
**メモリ**: O(n)（2行マトリックス）

---

### 2. Damerau-Levenshtein距離

**特徴**:

- Levenshteinの拡張版
- \*\*隣接する2文字の入れ替え（transposition）\*\*を1操作としてカウント
- タイプミスの検出に特化

**得意な処理**:

- 隣接文字の入れ替えミス（例: "teh" → "the", "recieve" → "receive"）
- キーボードでの入力ミス
- 一般的なタイプミスパターン

**使用例**:

```typescript
const search = new FuzzySearch<Product>(["name"], {
  algorithm: "damerau-levenshtein",
});

search.search("teh"); // "the"を検出（transposition: 1操作）
search.search("recieve"); // "receive"を検出
```

**Levenshteinとの違い**:

```
"teh" vs "the"
- Levenshtein: 2操作（削除+挿入 or 2回の置換）
- Damerau-Levenshtein: 1操作（隣接文字の入れ替え）
```

**計算量**: O(mn)\
**メモリ**: O(mn)（3行マトリックス）

---

### 3. Smith-Waterman（ローカルアライメント）

**特徴**:

- 生物情報学由来のローカルアライメントアルゴリズム
- 部分一致に特化
- 長いテキスト内の短いクエリの検出に優れる

**得意な処理**:

- 長い文字列内のサブストリング検索
- 部分一致の検出
- クエリがターゲットの一部に含まれるケース

**使用例**:

```typescript
const search = new FuzzySearch<Product>(["description"], {
  algorithm: "smith-waterman",
});

// 長いdescription内の"organic"を検出
search.search("organic"); // "This is a fresh organic apple from..."
```

**適用シーン**:

- メールアドレスの部分検索（例: "gmail" で "user@gmail.com" を検出）
- 長い説明文からのキーワード抽出
- URL・パスの部分マッチング

**計算量**: O(mn)\
**メモリ**: O(n)（2行マトリックス）

---

### 4. Jaro-Winkler距離

**特徴**:

- 短い文字列（特に名前）の類似度測定に特化
- **接頭辞一致にボーナスを与える**
- 文字列の順序を重視

**得意な処理**:

- 人名・地名の検索
- 短いキーワードのマッチング
- 接頭辞が重要な検索

**使用例**:

```typescript
const search = new FuzzySearch<Person>(["name"], {
  algorithm: "jaro-winkler",
});

search.search("Jon"); // "John"を高スコアで検出（prefix一致）
search.search("Tok"); // "Tokyo"を高スコアで検出
```

**接頭辞ボーナスの効果**:

```
"John" vs "Jon"  → 高スコア（prefix一致）
"John" vs "Nhoj" → 低スコア（anagram、順序が逆）
```

**適用シーン**:

- ユーザー名検索
- 都市・国名検索
- 短いタグ・カテゴリ名の検索

**計算量**: O(mn)\
**メモリ**: O(m + n)（マッチング配列）

---

### 5. Needleman-Wunsch（グローバルアライメント）

**特徴**:

- Smith-Watermanのグローバル版
- 文字列全体の最適なアライメントを計算
- 類似長の文字列比較に適している

**得意な処理**:

- 固定長または類似長の文字列比較
- 全体的な類似度測定
- DNA/タンパク質配列アライメント（生物情報学由来）

**使用例**:

```typescript
const search = new FuzzySearch<Code>(["code"], {
  algorithm: "needleman-wunsch",
});

search.search("ABC123"); // "ABC124"を検出（類似長コード)
search.search("PROD001"); // "PROD002"を検出（全体マッチ）
```

**Smith-Watermanとの違い**:

```
Smith-Waterman: ローカルアライメント（部分一致に強い）
Needleman-Wunsch: グローバルアライメント（全体の類似度を測定）
```

**適用シーン**:

- 固定長コードの類似検索
- DNA配列比較
- 類似長のテキスト比較

**計算量**: O(mn)\
**メモリ**: O(n)（2行マトリックス）

---

### 6. Hamming距離

**特徴**:

- 超高速 O(n) アルゴリズム
- **同じ長さの文字列専用**
- 位置ごとの差異をカウント

**得意な処理**:

- 固定長コード比較（郵便番号、製品ID、シリアル番号）
- エラー検出・訂正符号
- バイナリデータ比較

**使用例**:

```typescript
const search = new FuzzySearch<PostalCode>(["code"], {
  algorithm: "hamming",
});

search.search("100-0001"); // "100-0002"を検出（1桁違い）
search.search("ABC123"); // "ABC124"を検出（高速比較)
```

**制約**:

```
// 同じ長さの文字列のみ有効
"ABC123" vs "ABC124"  → 正常動作（1/6の差異）
"ABC123" vs "AB1234"  → 1.0を返す（長さが異なる）
```

**適用シーン**:

- 郵便番号検索
- 製品コード・シリアルナンバー検索
- 固定長IDの高速比較
- エラー検出システム

**計算量**: O(n)\
**メモリ**: O(1)（追加メモリなし）

---

## アルゴリズム比較表

| アルゴリズム            | 計算量 | メモリ | Transposition対応 | 部分一致 | 接頭辞ボーナス | 推奨文字列長       |
| ----------------------- | ------ | ------ | ----------------- | -------- | -------------- | ------------------ |
| **Levenshtein**         | O(mn)  | O(n)   | ❌                | △        | ❌             | あらゆる長さ       |
| **Damerau-Levenshtein** | O(mn)  | O(mn)  | ✅                | △        | ❌             | 短〜中（<100文字） |
| **Smith-Waterman**      | O(mn)  | O(n)   | ❌                | ✅       | ❌             | 中〜長             |
| **Jaro-Winkler**        | O(mn)  | O(m+n) | △                 | △        | ✅             | 短（<20文字）      |
| **Needleman-Wunsch**    | O(mn)  | O(n)   | ❌                | ○        | ❌             | 類似長             |
| **Hamming**             | O(n)   | O(1)   | ❌                | ❌       | ❌             | 固定長のみ         |

---

## 実例で見る選び方

### ケース1: ECサイトの商品検索

```typescript
const products = [
  { name: "Apple iPhone 15", category: "Electronics" },
  { name: "Apple MacBook Pro", category: "Electronics" },
  { name: "Organic Apples", category: "Food" },
];

const search = new FuzzySearch<Product>(["name", "category"], {
  algorithm: "levenshtein", // 汎用検索
});

search.search("Aple"); // すべてのApple製品を検出
search.search("Electornics"); // Electronicsを検出（typo）
```

**推奨**: `levenshtein`（バランスの取れた汎用性）

---

### ケース2: ユーザー名補完

```typescript
const users = [
  { name: "John Smith" },
  { name: "Jane Doe" },
  { name: "Jonathan Williams" },
];

const search = new FuzzySearch<User>(["name"], {
  algorithm: "jaro-winkler", // 短い名前 + prefix重視
});

search.search("Jon"); // "John", "Jonathan"を検出（prefix一致）
search.search("Joh"); // "John"を高スコアで検出
```

**推奨**: `jaro-winkler`（短い名前、接頭辞重視）

---

### ケース3: 文書内キーワード検索

```typescript
const documents = [
  {
    title: "Report 2024",
    content:
      "This quarterly report shows significant growth in organic traffic...",
  },
];

const search = new FuzzySearch<Document>(["content"], {
  algorithm: "smith-waterman", // 部分一致に強い
});

search.search("organic traffic"); // 長い文書内のキーワードを検出
```

**推奨**: `smith-waterman`（長文内の短いクエリ）

---

### ケース4: タイプミスが多い入力フォーム

```typescript
const keywords = [
  { tag: "receive" },
  { tag: "calendar" },
  { tag: "separate" },
];

const search = new FuzzySearch<Keyword>(["tag"], {
  algorithm: "damerau-levenshtein", // transposition対応
  threshold: 0.3,
});

search.search("recieve"); // "receive"を検出（ei↔ie）
search.search("calandar"); // "calendar"を検出（na↔an）
```

**推奨**: `damerau-levenshtein`（transpositionが多い）

---

## デフォルト設定の考え方

### いつ変更すべきか？

**デフォルトのまま（`levenshtein`）で十分なケース**:

- 一般的なfuzzy search
- 特定のバイアスが不要
- 幅広い入力パターンに対応したい

**変更を検討すべきケース**:

- 特定のエラーパターンが多い（→ `damerau-levenshtein`）
- 部分一致が重要（→ `smith-waterman`）
- 短い文字列で接頭辞が重要（→ `jaro-winkler`）

---

## 最適化オプションとの併用

アルゴリズム選択と最適化オプションは独立して設定できます：

```typescript
const search = new FuzzySearch<Item>(["name"], {
  algorithm: "damerau-levenshtein",
  optimizations: {
    useBitap: false, // Bitapを無効化
    useTwoStageEvaluation: true, // 2段階評価は有効
  },
});
```

詳細は[OPTIMIZATION.md](./OPTIMIZATION.md)を参照してください。

---

## まとめ

- **迷ったら**: `levenshtein`（デフォルト）
- **transpositionが多い**: `damerau-levenshtein`
- **部分一致重視**: `smith-waterman`
- **短文・名前・prefix重視**: `jaro-winkler`
- **類似長の全体比較**: `needleman-wunsch`
- **固定長コード（最速）**: `hamming`

実際の用途に合わせて試し、ベンチマークで性能を確認することをお勧めします。
