# 波仔厨房维护入口

正式菜谱主库位于本仓库 `outputs/cookbook/`。请先阅读 `outputs/cookbook/MAINTENANCE.md`，修改界面前另读 `outputs/cookbook/DESIGN.md`。不要回写旧聊天目录里的历史副本。菜品更新后依次运行 `python3 work/build_cookbook_demo.py` 和 `python3 work/package_offline_demo.py`，同步网页。

网页定稿和后续迭代入口为 `outputs/波仔厨房-浅底插画首页.html`。在 `work/kitchen_*` 修改界面源文件，再重新构建定稿。

收到新菜品照片即按主库 `COVER_STYLE.md` 生成清爽浅底封面，随菜归档为 `dishes/dish-编号/illustration.jpg`，再构建并检查 `outputs/波仔厨房-浅底插画首页.html`。具体触发、复做及待补规则见主库维护说明。若有 `outputs/cookbook/LOCAL_RULES.md`，同时遵循本库的个人偏好。

如果当前仓库含有 `ops/双版本维护.md`，功能、界面或共享规则变更后，按该文档生成并检查公开版快照。更新个人菜谱后，先保存档案并重建本地网页。收到用户明确要求同步到私人项目后，按同一文档将这批菜谱更新推送到私人仓库。
