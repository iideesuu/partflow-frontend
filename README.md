# PartFlow 前端（PLM / EBOM）

V1.5 研发 EBOM 前端工作台，覆盖物料与 Revision、EBOM 结构、MinIO 隔离上传、评审发布、审计以及 LDAP/存储配置。前端与后端通过 `/api/v1` 契约松耦合。

## 本地运行

本机无需安装 Node/npm，构建和运行都在 Docker 内完成：

```bash
docker compose build frontend
docker compose --env-file .env up -d --build frontend
```

访问 http://localhost:5173。初始化实验桶：

```bash
docker compose --profile storage-init run --rm minio-init
```

桶名称、MinIO 地址和凭据均由部署环境注入；ROOT 凭据只存在容器环境，不会进入前端 bundle。生产环境请使用 `.env`/Secret。

## 业务约束

- 物料号为 `NNNN-NNNNN`，小类前缀必须匹配大类，`00000` 禁用；取号来源只能从管理员 allowlist 选择。
- 新 Revision 固定从 `draft` 开始，发布后只读，变更通过 successor/ECO；EBOM 只允许 `EBOM` 类型并引用具体 Revision。
- 附件走 presigned multipart：quarantine → scan → draft → promotion → release。扫描未通过时禁止预览、下载、绑定和发布。
- LDAP 只负责身份认证，RBAC、DataScope、SoD 与审计由后端授权；前端不保存凭据。

