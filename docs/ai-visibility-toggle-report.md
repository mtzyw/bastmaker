# AI 可见性开关改造报告

## 总览
- 目标：为主要生成类功能统一提供“公开到个人主页 / 关闭仅自己可见”控制，确保任务从创建、轮询到重新生成都保持同一可见性状态。
- 范围：前端 7 个面板、后端 4 条 API route、共享乐观历史与重新生成管线、全局 UI Switch 样式与侧边导航。
- 数据：依托 Supabase `ai_jobs.is_public` 现有字段，无需额外迁移。

## 前端改造

### 公共组件
- `components/ui/switch.tsx`
  - **轨道颜色**：开启 `#31d158`，关闭 `#3e3e3c`。
  - **Thumb**：永久白色，保持与深色背景对比。
  - **行为**：利用 `data-[state]` 伪类，无需面板单独覆写。

### 生成面板（按任务类型划分）

| 文件 | 新增 state | 表单提交调整 | 乐观历史调整 | Reprompt 回填 |
| --- | --- | --- | --- | --- |
| `components/ai/TextToImageLeftPanel.tsx` | `const [isPublic, setIsPublic] = useState(true)` | POST `/api/ai/freepik/tasks` payload 增加 `is_public` | `CreationItem.metadata/inputParams` 写入 `is_public` | 热启动时若 `draft.isPublic` 存在，则恢复 |
| `components/ai/ImageToImageLeftPanel.tsx` | 同上 | 同上（携带参考图路径） | 乐观记录中的 `metadata.reference_inputs` 保留，同时新增 `is_public` | 同上 |
| `components/ai/TextToVideoLeftPanel.tsx` | 同上 | POST `/api/ai/freepik/video` payload 加 `is_public` | `metadata.reference_inputs` 维持默认并写入 `is_public` | `repromptDraft.isPublic` 恢复 |
| `components/ai/ImageToVideoLeftPanel.tsx` | 同上 | 同上，兼容 transition 模式 | 所有关联 `reference_inputs` 与 `reference_image_urls` 均保持，加 `is_public` | 同上 |
| `components/ai/VideoEffectsEditorLeftPanel.tsx` | 同上 | POST `/api/ai/effects/video` payload 添加 `is_public` | 乐观条目 metadata/inputParams 均含 `is_public` | 该面板无 reprompt 功能，不涉及 |
| `components/lip-sync/LipSyncLeftPanel.tsx` | 同上 | POST `/api/ai/freepik/lip-sync` payload 添加 `is_public` | 声明 meta/inputParams 的视频音频地址，并写入 `is_public` | 暂无 reprompt，面板本次新增 |
| `components/sound-generation/SoundGenerationLeftPanel.tsx` | 同上 | POST `/api/ai/freepik/sound` payload 添加 `is_public` | 元数据保留声音参数并写入 `is_public` | `repromptDraft.isPublic` 恢复 |

#### UX 文案&布局
- 所有面板底部开关采用统一文案：
  ```
  公开到个人主页
  关闭后仅自己可见
  ```
- 放置在 Credits 信息之上，视觉上与按钮形成一个固定底部控制区。

### 导航与入口
- `ai-sidebar/components/ai-sidebar.tsx`
  - 顺序调整：`text-to-video` → `image-to-video` → `lip-sync` → `sound-generation` → `video-editing`(重命名) → `ai-video-effects`。
  - “视频编辑”文案改为“AI图片特效”，方便后续在同类体验中复用。

### 其他前端影响
- 所有 payload 构造方法、`handleCreate` 回调、`buildHistoryItem` 工具函数因新增参数增加 `useCallback` 依赖，需要注意与 `eslint` hooks 检查的一致性。
- 颜色更新除 `Switch` 以外未涉及其它 UI 改动，暗色面板下对比度测试已通过手动验证。

## 后端改造

### API 路由级别

| 路由文件 | Schema 变化 | Supabase 写入 | Share Metadata | 其他说明 |
| --- | --- | --- | --- | --- |
| `app/api/ai/freepik/video/route.ts` | `requestSchema` 新增 `is_public` | `ai_jobs.insert` 增加 `is_public: isPublic` | `ensureJobShareMetadata(..., isPublic)` | `metadata_json`/`input_params_json` 记录 `is_public`，以及 webhook 更新阶段保持该字段 |
| `app/api/ai/effects/video/route.ts` | 同上 | 同上 | 同上 | 兼容 effect template 自带资产，`metadataOverrides`、`inputOverrides` 全部携带 `is_public` |
| `app/api/ai/freepik/lip-sync/route.ts` | 原有基础上新加字段 | 同上 | 同上 | lip-sync 任务 metadata 中新增 `is_public` |
| `app/api/ai/freepik/sound/route.ts` | 同上 | 同上 | 同上 | 以 sound 模型参数为基础，写入可见性 |
| `app/api/ai/freepik/tasks/route.ts` | 既有实现已支持 `is_public`，保持不变 | 已写入 | 已写入 | 无需额外改动 |

### Credits & Webhook
- `deductCredits` 与 `refundCreditsForJob` 逻辑未受影响，只是在日志中增加了 `is_public` 透传，便于后续埋点分析。
- 所有 route 在 webhook 回调或创建任务失败时，都会保留 `metadata_json.is_public`，避免后续枚举 `ai_jobs` 时出错。

## 共享逻辑

- `lib/ai/creation-retry.ts`
  - **类型层**：`RegenerationPlan`、`RepromptDraft` 每个分支增加 `isPublic?: boolean`。
  - **生成 Plan**：
    - `buildTextToImagePlan` `buildImageToImagePlan` `buildTextToVideoPlan` `buildImageToVideoPlan` `buildSoundEffectPlan` 均从原任务 metadata 中读取布尔值，默认 `true`，并写回 payload/optimistic。
  - **Reprompt**：
    - `buildTextToImageReprompt`、`buildImageToImageReprompt`、`buildTextToVideoReprompt`、`buildImageToVideoReprompt`、`buildSoundEffectReprompt` 在返回草稿时附带 `isPublic`。
  - **Video Effect Plan**：额外把 `is_public` 写入 effect 任务的 `metadataOverrides` 与 `inputOverrides`，保持特效类的复用。
  - 这些改造保证“重新生成”“复制任务”体验与初始创建保持一致。

## 数据层
- 依赖 `supabase.ai_jobs.is_public` 现有布尔列。
- `ensureJobShareMetadata` 增量参数 `isPublic` 现被所有调用方正确传递，无需 schema 变更。

## 颜色 / 品牌调整
- `Switch` 颜色满足活跃绿色、关闭灰黑的风格设定，适配深色 UI。
- 面板新增文案与 Credits 区域使用现有白色系，未引入额外色值。

## 适配后续“图片特效”功能的建议

### 前端
1. 复制现有面板底部模板：`Switch` + Credits + CTA，确保 `isPublic` 在 state、payload、乐观历史中同步。
2. 若图片特效允许“再次生成”，需在 `creation-retry` 中新增相应 `buildImageEffectPlan` / `Reprompt` 分支。
3. 检查 `useRepromptStore` 读取是否覆盖新 kind。

### 后端
1. 复用 `app/api/ai/effects/video/route.ts` 的模式，新建 `app/api/ai/effects/image/route.ts` 时直接带上 `is_public`。
2. 确保 `ensureJobShareMetadata` 调用传入真实可见性，防止公开 feed 难以过滤。
3. 如走新 provider，注意 `metadata_json` 中的命名：`source` 设为 `"image" | "image-effect"` 以便后续过滤。

### 数据库
- 若继续写入 `ai_jobs`，无需 schema 调整；但若考虑拆分表，请确保：`is_public`、`share_slug`、`public_assets` 等字段同样可用。
- 建议建立视图或 Materialized View 帮助筛选 `is_public = true` 的特效作品，提高 gallery 查询效率。

### 导航 / 体验
- 侧边栏新增入口时，继续维护 `ai-sidebar/components/ai-sidebar.tsx` 的 `menuSections` 配置与 `handleItemClick` 路由映射。
- 页面路由建议放在 `/image-effects` 或 `/image-special-effects` 下，方便重用 `ensureJobShareMetadata` 的路径推断。

## 受影响页面概览
- `/text-to-image`
- `/image-to-image`
- `/text-to-video`
- `/image-to-video`
- `/video-effects/[slug]`
- `/lip-sync`
- `/sound-generation`

## 测试与发布注意事项

### 自动化/静态检查
- `pnpm lint` 仍会因既有文件的 Hook 顺序报错：`FluxKontextProClient.tsx`、`MultiImageKontextProClient.tsx`。本次改造未新增新的 lint 误报，但在提交前需关注这些遗留问题。
- TypeScript 编译未报告新错误；所有 payload 属性均在类型中声明。

### 手动验证建议
1. **面板级**：七个生成面板分别在开关开/关状态下创建任务，确认个人主页或历史列表上的可见性标记是否同步。
2. **共享视图**：`/explore` 或公共 feed 页面确认仅 `is_public=true` 的任务出现。
3. **Webhook**：触发一次成功与一次失败的任务，确保 `is_public` 在状态回写后仍存在于 `metadata_json`。
4. **Reprompt**：对历史任务使用“重新生成/再次生成”功能，确认开关默认值与原任务一致。

### 监控/回滚
- 若误将开关置为 `false`：任务依然写入 `ai_jobs`，但 `ensureJobShareMetadata` 会阻止分享链接对外曝光，可在后台手动调整 `ai_jobs.is_public` 并刷新缓存。
- 若路由出现 400 错误，多半是 payload 缺少 `is_public`；可通过 server log（`[freepik-video] request payload`）快速定位。
