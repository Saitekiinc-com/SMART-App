# 06_呼び出すAPI

## 目的

各画面・操作で呼び出すAPIの一覧と、画面ごとの対応を記載する。

---

## 画面別API一覧

| 画面ID | API名 | メソッド | パス | 用途 | 対象テーブル |
|--------|-------|----------|------|------|--------------|
| S-01 | ログイン | POST | /api/auth/login | 認証 | users |
| S-01 | サインアップ | POST | /api/auth/signup | ユーザー登録 | users |
| S-01 | ユーザー情報取得 | GET | /api/users/me | ログイン後のユーザー情報取得 | users |
| S-02 | 招待情報取得 | GET | /api/invites/{token} | 招待リンクから招待情報を取得 | team_invites |
| S-02 | 招待受諾 | POST | /api/invites/{token}/accept | チームへの参加 | team_invites, team_members |
| S-03 | 所属チーム一覧取得 | GET | /api/teams | ユーザーが所属するチーム一覧 | teams, team_members |
| S-04 | ゴール一覧取得 | GET | /api/teams/{teamId}/goals | ゴール一覧表示 | smart_goals |
| S-04 | 投票 | POST | /api/goals/{goalId}/votes | ゴールに投票 | goal_votes |
| S-04 | 投票解除 | DELETE | /api/goals/{goalId}/votes | 投票を取り消し | goal_votes |
| S-05 | ゴール作成 | POST | /api/goals | ゴール保存 | smart_goals, approaches |
| S-06 | ゴール詳細取得 | GET | /api/goals/{goalId} | ゴール詳細表示 | smart_goals, approaches |
| S-06 | ゴール削除 | DELETE | /api/goals/{goalId} | ゴール削除 | smart_goals, approaches |
| S-06 | ステータス更新 | PATCH | /api/goals/{goalId} | ゴールステータス変更 | smart_goals |
| S-06 | アプローチ完了状態更新 | PATCH | /api/approaches/{approachId} | アプローチの完了状態切り替え | approaches |
| S-06 | フィードバック保存 | POST | /api/goals/{goalId}/feedback | 完了時のフィードバック保存 | goal_feedback |
| S-07 | ゴール詳細取得 | GET | /api/goals/{goalId} | 編集画面表示時のデータ取得 | smart_goals, approaches |
| S-07 | ゴール更新 | PUT | /api/goals/{goalId} | ゴール情報更新 | smart_goals, approaches |
| S-08 | 通知一覧取得 | GET | /api/notifications | 通知一覧表示 | notifications |
| S-08 | 通知既読化 | PATCH | /api/notifications/{notificationId} | 通知を既読にする | notifications |
| S-09 | チーム情報取得 | GET | /api/teams/{teamId} | チーム設定画面のデータ取得 | teams |
| S-09 | チーム情報更新 | PUT | /api/teams/{teamId} | チーム情報更新 | teams |
| S-09 | メンバー一覧取得 | GET | /api/teams/{teamId}/members | メンバー一覧表示 | team_members, users |
| S-09 | メンバー削除 | DELETE | /api/teams/{teamId}/members/{userId} | メンバーをチームから削除 | team_members |
| S-09 | メンバーロール変更 | PATCH | /api/teams/{teamId}/members/{userId} | メンバーのロール変更 | team_members |
| S-10 | 招待リンク生成 | POST | /api/teams/{teamId}/invites | 招待リンク生成 | team_invites |
| S-10 | 招待リンク取得 | GET | /api/teams/{teamId}/invites | 既存の招待リンク取得 | team_invites |

---

## API仕様詳細（抜粋）

### 認証関連

- **POST /api/auth/login**: リクエスト `{ email, password }`。レスポンス（200）`{ token, user: { id, email, name } }`
- **POST /api/auth/signup**: リクエスト `{ email, password, name }`。レスポンス（200）同上
- **GET /api/users/me**: 認証必須（Bearer Token）。レスポンス（200）`{ id, email, name, teams: [{ id, name, role }] }`

### チーム・招待・ゴール・投票・アプローチ・通知・フィードバック

各APIのリクエストボディ・レスポンス形式・エラーコードは、上記画面別一覧および 05_フロント側処理フロー を参照。  
（詳細なJSONスキーマは Notion 元ページまたはバックエンドAPI仕様書を参照。）

---

## 参照

- CRUD図
- テーブル定義一覧
- フロント側処理フロー（05_フロント側処理フロー）

---
出典: [Notion - 06_呼び出すAPI](https://www.notion.so/30f408701297803e812fe888269f7bf3)
