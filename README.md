# 価値判断AIマッチング（10問 + 6軸プロフィール）

`index.html` をブラウザで開いてください。外部ライブラリ・バックエンド・通信不要です。

- `trolley_matching_10_questions.md` の全10問を固定内容ID（`q01_a` / `q01_b` 等）で採用しています。左右の表示順はランダムでも採点は内容IDです。
- 各問の結果 → 10問の一致率一覧 → **6軸プロフィール（最終画面）** の順です。
- AI A/B/C は**架空のモック回答**です。実測したLLMの回答率ではなく、各問一つの選択のみです。従って一致率は10問の二択一致（10%刻み）です。
- `valueProfile` は `app-core.js` の純粋関数で、仕様の6式を丸めずに計算し、画面のみ四捨五入します。プロフィールの50は軸ごとに意味が違います。
- 旧1.2版とは問題文・内容IDが異なるため `QUESTION_VERSION='2.0'` とし旧回答を復元しません。診断保存キーは既存の `value-judgment-ai-matching-week2-v1`、設定は別キー `value-judgment-ai-matching-settings-v1` を維持。
- `app-core.js` は問題・モック・採点。`store.js` は診断保存。`presenter.js` は表示データ。`view.js` はDOM。`scene.js` は演出。`app.js` は結線。

## 将来のLLM観戦モードへの境界

現在は観戦モードを**実装していません**。将来は `llm_spectator_requirements.md` に従い、別モードの再生状態・録画回答レコード・モデル選択を追加します。既存の利用者回答を変更せず、`scene.playChoice()` を再利用します。外部LLM取得は再生中に行わず、記録済みデータを別データソースで提供してください。各記録には少なくとも `questionVersion`, `modelId`, `modelVersion`, `systemPromptVersion`, `questionId`, `optionId`, `sourceType` と取得条件を保持し、原稿のA/B内容IDを照合します。複数回の回答率は実測したときにのみ導入します。

## 動作確認

`node tests/test-app-core.js` で純粋関数のテスト。視覚的な実ブラウザ確認は別途必要です。特にトロッコ演出は元のままなので、歩道橋・抽選・救助問題でも象徴的な演出となります。

全指標は提示した10問の選択を整理したもので、人格や道徳的優劣を測定しません。
