# YYC³ 多门店综合管理系统数据库详情总结

> **YanYuCloudCube - 言启象限 | 语枢未来**
> ***Words Initiate Quadrants, Language Serves as Core for the Future***

---

**数据库名称**: `yyc3_33`  
**数据库版本**: MariaDB 10.x  
**字符集**: utf8mb4  
**排序规则**: utf8mb4_unicode_ci  
**表总数**: 186 张  
**字段总数**: 约 1800 个  
**生成时间**: 2026-02-21  
**版本**: 2.0.0

---

## 📋 目录

1. [数据库连接信息](#数据库连接信息)
2. [用户账号配置](#用户账号配置)
3. [导航架构模块对应](#导航架构模块对应)
4. [完整表清单](#完整表清单)
5. [核心业务变量](#核心业务变量)
6. [数据字典](#数据字典)
7. [维护说明](#维护说明)

---

## 🔌 数据库连接信息

### 连接参数

| 参数 | 值 |
|------|-----|
| 主机 | 127.0.0.1 |
| 端口 | 3306 |
| 数据库 | yyc3_33 |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |
| Socket | /var/lib/mysql/mysql.sock |

### 连接字符串

```
mysql://yyc3_33:yyc3_33@127.0.0.1:3306/yyc3_33?charset=utf8mb4
```

---

## 👥 用户账号配置

| 用户名 | 密码 | 角色 | 权限范围 | 说明 |
|--------|------|------|----------|------|
| yyc3_33 | yyc3_33 | super_admin | ALL PRIVILEGES | 主账号-超级管理员 |
| yyc3_yy | yyc3_yy_2026 | super_admin | ALL PRIVILEGES | 管理账号-超级管理员 |
| yyc3_web | yyc3_web_2026 | read_write | SELECT, INSERT, UPDATE | Web应用账号 |
| yyc3_kb | yyc3_kb_2026 | read_write | SELECT, INSERT, UPDATE | 知识库账号 |
| yyc3_test | yyc3_test_2026 | full_access | ALL PRIVILEGES | 测试账号 |
| yyc3_22 | yyc3_22 | read_write | SELECT, INSERT, UPDATE | 运营管理账号 |
| yyc3_66 | yyc3_66 | read_only | SELECT | 查看管理账号 |

---

## 🗂️ 导航架构模块对应

### 模块统计

| 序号 | 模块名称 | 路由前缀 | 页面数 | 表数量 | 说明 |
|------|----------|----------|--------|--------|------|
| 1 | 数据中心 | /data-center | 7 | 8 | 数据可视化、报表、预警 |
| 2 | 核心业务 | /core-business | 17 | 29 | 销售、采购、库存、生产 |
| 3 | 人力资源 | /human-resources | 10 | 16 | 员工、招聘、薪酬、绩效 |
| 4 | 财务资产 | /finance-assets | 12 | 12 | 发票、支付、预算、资产 |
| 5 | 办公协同 | /office-collaboration | 13 | 10 | 会议、文档、流程、审批 |
| 6 | AI智能 | /ai-intelligence | 17 | 11 | NLP、图像、推荐、RPA |
| 7 | 系统设置 | /system-settings | 16 | 14 | 用户、配置、监控、插件 |
| 8 | 客户运维 | /customer-service | 14 | 33 | 客户、会员、营销、服务 |
| 9 | 风险管控 | /risk-management | 5 | 5 | 风险识别、评估、处置 |
| 10 | 战略决策 | /strategy-decision | 4 | 4 | 环境分析、目标分解 |
| 11 | 商品管理 | /goods-management | 8 | 9 | 商品、物料、品牌 |
| 12 | 经营分析 | /business-analysis | 6 | 6 | 日报、月报、成本 |
| 13 | 员工发展 | /employee-development | 17 | 30 | 培训、知识、效率 |

**总计**: 73 个页面 → 186 张数据表

---

## 📊 完整表清单

### 1️⃣ 数据中心模块 (8张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| data_dashboard | 数据大屏配置 | dashboard_code, dashboard_name, layout_config |
| data_report_template | 报表模板 | template_code, template_name, sql_template |
| data_alert_rule | 预警规则 | rule_code, metric_name, threshold_value |
| data_alert_record | 预警记录 | rule_id, alert_time, handle_status |
| ai_ops_system | AI运维系统 | ops_id, ops_type, automation_level |
| ai_marketing_engine | AI营销引擎 | engine_id, engine_type, algorithm |
| ai_decision_support | AI决策支持 | support_id, decision_type, recommendation |
| app_overview_dashboard | 应用概览看板 | dashboard_id, metrics, visualization |

### 2️⃣ 核心业务模块 (29张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| base_store | 门店基础信息 | store_id, store_code, store_name, store_status |
| base_goods_category | 商品分类 | category_id, category_name, parent_id |
| base_unit | 计量单位 | unit_id, unit_name, unit_abbr |
| market_info | 市场信息 | info_code, info_type, title, content |
| sales_lead | 销售线索 | lead_code, lead_name, lead_source, lead_status |
| contract_info | 合同管理 | contract_code, contract_name, contract_amount |
| logistics_tracking | 物流追踪 | tracking_code, carrier, tracking_status |
| project_info | 项目管理 | project_code, project_name, project_status |
| work_order | 工单管理 | order_code, order_type, assignee_id |
| fulfillment_order | 履约订单 | fulfillment_code, fulfillment_type, fulfillment_status |
| sale_order | 销售订单 | sale_order_id, sale_order_code, total_amount |
| sale_order_item | 销售订单明细 | order_item_id, sale_order_id, goods_id |
| sale_outstock | 销售出库 | outstock_id, sale_order_id, outstock_time |
| sale_outstock_item | 销售出库明细 | outstock_item_id, outstock_id, goods_id |
| purchase_supplier | 供应商信息 | supplier_id, supplier_code, supplier_name |
| purchase_order | 采购订单 | purchase_order_id, purchase_order_code, supplier_id |
| purchase_order_item | 采购订单明细 | order_item_id, purchase_order_id, goods_id |
| purchase_instock | 采购入库 | instock_id, purchase_order_id, instock_time |
| purchase_instock_item | 采购入库明细 | instock_item_id, instock_id, goods_id |
| inventory_stock | 库存信息 | stock_id, store_id, goods_id, quantity |
| inventory_check | 库存盘点 | check_id, check_code, check_status |
| inventory_check_item | 盘点明细 | check_item_id, check_id, goods_id |
| inventory_allocation | 库存调拨 | allocation_id, allocation_code, from_store, to_store |
| inventory_allocation_item | 调拨明细 | allocation_item_id, allocation_id, goods_id |
| inventory_warning | 库存预警 | warning_id, goods_id, warning_type |
| production_plan | 生产计划 | plan_id, plan_code, product_id, plan_quantity |
| production_work_order | 生产工单 | work_order_id, plan_id, work_order_status |
| production_product_instock | 生产入库 | instock_id, work_order_id, quantity |
| production_material_consume | 物料消耗 | consume_id, work_order_id, material_id |

### 3️⃣ 人力资源模块 (16张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| manage_employee | 员工信息 | employee_id, employee_code, employee_name |
| manage_candidate | 候选人 | candidate_id, candidate_name, position |
| manage_recruitment_plan | 招聘计划 | plan_id, plan_name, position_count |
| manage_training_plan | 培训计划 | plan_id, plan_name, training_type |
| hr_salary | 薪酬管理 | employee_id, salary_month, actual_salary |
| manage_performance_evaluation | 绩效考核 | evaluation_id, employee_id, score |
| manage_performance_target | 绩效目标 | target_id, employee_id, target_value |
| manage_attendance | 考勤记录 | attendance_id, employee_id, check_time |
| hr_business_trip | 商务差旅 | trip_code, employee_id, destination |
| hr_talent_profile | 人才画像 | employee_id, skill_tags, competency_model |
| hr_scheduling | 排班管理 | employee_id, schedule_date, shift_type |
| manage_org_structure | 组织架构 | org_id, org_name, parent_id |
| manage_role | 角色管理 | role_id, role_code, role_name |
| manage_role_permission | 角色权限 | role_id, permission_id |
| manage_permission | 权限管理 | permission_id, permission_code, permission_name |
| manage_employee_role | 员工角色 | employee_id, role_id |

### 4️⃣ 财务资产模块 (12张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| finance_accounts_payable | 应付账款 | payable_id, supplier_id, amount |
| finance_accounts_receivable | 应收账款 | receivable_id, customer_id, amount |
| finance_invoice | 发票管理 | invoice_code, invoice_number, total_amount |
| finance_payment | 支付管理 | payment_code, payment_type, amount |
| finance_loan | 贷款管理 | loan_code, loan_amount, interest_rate |
| finance_tax | 税务管理 | tax_code, tax_type, tax_amount |
| finance_budget | 预算管理 | budget_code, budget_amount, used_amount |
| finance_reimbursement | 报销管理 | reimburse_code, reimburse_amount |
| asset_info | 资产信息 | asset_code, asset_name, original_value |
| manage_equipment | 设备管理 | equipment_id, equipment_name, equipment_status |
| asset_inventory_record | 资产盘点 | inventory_code, total_count, actual_count |
| finance_reconciliation | 对账记录 | reconcile_code, our_balance, their_balance |

### 5️⃣ 办公协同模块 (10张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| office_meeting | 会议管理 | meeting_code, meeting_title, start_time |
| office_document | 文档管理 | doc_code, doc_name, file_url |
| office_search_log | 搜索日志 | user_id, search_keyword, search_time |
| office_creative_project | 创意项目 | project_code, project_type, team_members |
| process_model | 流程模型 | model_id, model_name, process_config |
| process_instance | 流程实例 | instance_id, model_id, instance_status |
| approval_node | 审批节点 | node_id, node_name, node_type |
| approval_record | 审批记录 | record_id, instance_id, approver |
| custom_form | 自定义表单 | form_id, form_name, form_schema |
| custom_form_data | 表单数据 | data_id, form_id, form_data |

### 6️⃣ AI智能模块 (11张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| ai_nlp_task | 自然语言任务 | task_code, task_type, input_text, output_text |
| ai_image_task | 图像识别任务 | task_code, image_url, result_json |
| ai_recommendation | 智能推荐 | recommend_code, recommend_type, recommend_items |
| ai_rpa_task | RPA任务 | task_code, task_name, script_content |
| ai_chatbot_log | 智能客服日志 | session_id, user_input, bot_response |
| ai_assistant_log | AI助手日志 | user_id, query, response |
| ai_content_task | AI内容创作 | task_code, task_type, input_prompt |
| customer_service_knowledge | 客服知识库 | knowledge_id, question, answer |
| customer_service_ticket | 客服工单 | ticket_id, ticket_type, ticket_status |
| customer_service_chat_log | 客服聊天记录 | chat_id, session_id, message |
| customer_service_flow | 客服流程 | flow_id, flow_name, flow_steps |

### 7️⃣ 系统设置模块 (14张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| sys_user | 系统用户 | user_code, username, real_name |
| sys_config | 系统配置 | config_key, config_value, config_type |
| sys_dict | 数据字典 | dict_id, dict_type, dict_code, dict_name |
| sys_operation_log | 操作日志 | log_id, user_id, operation_type |
| sys_monitor_metric | 监控指标 | metric_name, metric_value, collect_time |
| sys_backup_log | 备份日志 | backup_id, backup_type, backup_time |
| sys_help_article | 帮助文章 | article_code, title, content |
| sys_data_desensitization | 数据脱敏 | desensitization_id, table_name, field_name |
| sys_slow_query_analysis | 慢查询分析 | query_id, query_sql, execution_time |
| sys_wechat_config | 微信配置 | config_type, app_id, app_secret |
| sys_channel | 渠道管理 | channel_code, channel_name, channel_type |
| sys_api_key | API密钥 | key_code, api_key, permissions |
| sys_plugin | 插件管理 | plugin_code, plugin_name, plugin_type |
| sys_app | 应用管理 | app_code, app_name, app_type |

### 8️⃣ 客户运维模块 (33张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| customer_info | 客户信息 | customer_id, customer_code, customer_name |
| customer_member | 会员信息 | member_id, customer_id, member_level |
| customer_label | 客户标签 | label_id, label_name, label_type |
| customer_label_relation | 客户标签关联 | customer_id, label_id |
| customer_follow | 客户跟进 | follow_id, customer_id, follow_time |
| customer_feedback | 客户反馈 | feedback_id, customer_id, feedback_type |
| customer_consume_record | 消费记录 | record_id, customer_id, consume_amount |
| customer_points_rule | 积分规则 | rule_id, rule_name, points_value |
| customer_points_record | 积分记录 | record_id, customer_id, points_change |
| customer_points_exchange | 积分兑换 | exchange_id, customer_id, points_used |
| customer_points_exchange_item | 兑换明细 | exchange_item_id, exchange_id, item_id |
| customer_portrait_analysis | 客户画像分析 | analysis_id, customer_id, portrait_data |
| customer_churn_warning | 流失预警 | warning_id, customer_id, warning_level |
| customer_churn_rescue | 流失挽回 | rescue_id, customer_id, rescue_status |
| customer_precise_marketing | 精准营销 | marketing_id, customer_id, marketing_type |
| customer_marketing_touch | 营销触达 | touch_id, customer_id, touch_type |
| customer_referral_reward | 推荐奖励 | reward_id, referrer_id, reward_amount |
| customer_satisfaction_survey | 满意度调查 | survey_id, survey_name, survey_time |
| customer_satisfaction_answer | 调查答案 | answer_id, survey_id, customer_id |
| customer_service_channel | 客服渠道 | channel_id, channel_name, channel_type |
| customer_service_channel_preference | 渠道偏好 | preference_id, customer_id, channel_id |
| customer_service_cross_field | 跨领域服务 | service_id, service_type, service_content |
| customer_service_customized | 定制服务 | customized_id, customer_id, service_content |
| customer_service_flow_trace | 服务流程追踪 | trace_id, service_id, trace_time |
| customer_service_innovation_platform | 创新平台 | platform_id, platform_name, platform_type |
| customer_service_quality_supervision | 质量监督 | supervision_id, service_id, quality_score |
| customer_service_standard_manual | 标准手册 | manual_id, manual_name, manual_content |
| customer_social_graph | 社交图谱 | graph_id, customer_id, relation_data |

### 9️⃣ 风险管控模块 (5张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| risk_identification_model | 风险识别模型 | model_id, model_name, model_type |
| risk_evaluation_process | 风险评估流程 | process_id, risk_id, evaluation_result |
| risk_disposal_trace | 风险处置追踪 | trace_id, risk_id, disposal_status |
| compliance_management | 合规管理 | compliance_id, compliance_type, compliance_status |
| crisis_management | 危机管理 | crisis_id, crisis_type, crisis_level |

### 🔟 战略决策模块 (4张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| strategy_environment_analysis | 环境分析 | analysis_id, analysis_type, analysis_result |
| strategy_target_decomposition | 目标分解 | target_id, target_name, target_value |
| strategy_execution_monitor | 执行监控 | monitor_id, target_id, execution_progress |
| investment_decision | 投资决策 | decision_id, decision_type, decision_amount |

### 1️⃣1️⃣ 商品管理模块 (9张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| goods_product | 商品信息 | product_id, product_code, product_name |
| goods_material | 物料信息 | material_id, material_code, material_name |
| goods_relation_graph | 关联图谱 | graph_id, product_id, relation_type |
| goods_relation_behavior | 关联行为 | behavior_id, product_id, behavior_type |
| goods_sale_forecast | 销售预测 | forecast_id, product_id, forecast_quantity |
| brand_management | 品牌管理 | brand_id, brand_name, brand_logo |
| supplier_rating | 供应商评级 | rating_id, supplier_id, rating_score |
| online_goods_evaluate | 商品评价 | evaluate_id, product_id, customer_id |
| online_order | 在线订单 | order_id, order_code, order_amount |

### 1️⃣2️⃣ 经营分析模块 (6张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| business_daily_report | 日报 | report_id, report_date, report_data |
| business_monthly_report | 月报 | report_id, report_month, report_data |
| business_cost_detail | 成本明细 | cost_id, cost_type, cost_amount |
| business_expense | 费用管理 | expense_id, expense_type, expense_amount |
| business_promotion | 促销管理 | promotion_id, promotion_name, promotion_type |
| business_analysis_summary | 分析汇总 | summary_id, summary_type, summary_data |

### 1️⃣3️⃣ 员工发展模块 (30张表)

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| manage_employee_training | 员工培训 | training_id, employee_id, training_content |
| manage_employee_transfer | 员工调动 | transfer_id, employee_id, transfer_type |
| manage_employee_honor | 员工荣誉 | honor_id, employee_id, honor_type |
| manage_employee_communication | 员工沟通 | communication_id, employee_id, communication_type |
| manage_employee_store_permission | 门店权限 | permission_id, employee_id, store_id |
| manage_360_evaluation | 360评估 | evaluation_id, employee_id, evaluator_id |
| manage_honor_config | 荣誉配置 | config_id, honor_name, honor_level |
| manage_bonus_rule | 奖金规则 | rule_id, rule_name, rule_amount |
| manage_bonus_issue | 奖金发放 | issue_id, employee_id, issue_amount |
| manage_bonus_channel | 奖金渠道 | channel_id, channel_name, channel_type |
| manage_announcement_view | 公告查看 | view_id, announcement_id, employee_id |
| manage_store_announcement | 门店公告 | announcement_id, store_id, announcement_title |
| manage_hr_cost | 人力成本 | cost_id, department_id, cost_amount |
| manage_innovation_proposal | 创新提案 | proposal_id, employee_id, proposal_content |
| manage_innovation_proposal_interact | 提案互动 | interact_id, proposal_id, interact_type |
| manage_innovation_external_partner | 外部合作伙伴 | partner_id, partner_name, partner_type |
| manage_efficiency_diagnosis | 效率诊断 | diagnosis_id, department_id, diagnosis_result |
| manage_efficiency_metric_config | 效率指标配置 | config_id, metric_name, metric_target |
| manage_efficiency_metric_monitor | 效率指标监控 | monitor_id, config_id, metric_value |
| manage_efficiency_employee_workload | 员工工作量 | workload_id, employee_id, workload_value |
| manage_efficiency_employee_time_management | 时间管理 | time_id, employee_id, time_data |
| manage_efficiency_cross_department_task | 跨部门任务 | task_id, task_name, departments |
| manage_efficiency_automation_scheme | 自动化方案 | scheme_id, scheme_name, automation_type |
| manage_knowledge_repository | 知识库 | repository_id, repository_name, repository_type |
| manage_knowledge_co_create | 知识共创 | create_id, repository_id, contributor_id |
| manage_knowledge_expert_network | 专家网络 | expert_id, expert_name, expertise |
| manage_knowledge_employee_learning_path | 学习路径 | path_id, employee_id, path_data |
| manage_knowledge_employee_learning_record | 学习记录 | record_id, employee_id, learning_content |
| manage_knowledge_retrieval_record | 检索记录 | record_id, employee_id, search_keyword |
| manage_knowledge_update_iteration | 更新迭代 | iteration_id, repository_id, iteration_content |

---

## 🔑 核心业务变量

### 通用主键变量

| 变量名 | 类型 | 说明 | 使用表 |
|--------|------|------|--------|
| id | INT AUTO_INCREMENT | 主键ID | 所有表 |
| create_time | DATETIME | 创建时间 | 所有表 |
| update_time | DATETIME | 更新时间 | 所有表 |
| creator | VARCHAR(32) | 创建人 | 大部分表 |
| status | TINYINT(1) | 状态 | 大部分表 |
| remark | VARCHAR(500) | 备注 | 大部分表 |

### 业务核心变量

| 变量名 | 类型 | 说明 | 关联表 |
|--------|------|------|--------|
| store_id | INT | 门店ID | base_store |
| employee_id | INT | 员工ID | manage_employee |
| customer_id | INT | 客户ID | customer_info |
| member_id | INT | 会员ID | customer_member |
| order_id | INT | 订单ID | sale_order/purchase_order |
| product_id | INT | 商品ID | goods_product |
| supplier_id | INT | 供应商ID | purchase_supplier |
| project_id | INT | 项目ID | project_info |
| contract_id | INT | 合同ID | contract_info |

---

## 📖 数据字典

### 门店状态 (store_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 暂停营业 | 门店暂停营业状态 |
| 1 | 正常营业 | 门店正常营业状态 |
| 2 | 已注销 | 门店已注销状态 |

### 订单状态 (order_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 待处理 | 订单待处理状态 |
| 1 | 处理中 | 订单处理中状态 |
| 2 | 已完成 | 订单已完成状态 |
| 3 | 已取消 | 订单已取消状态 |
| 4 | 已退款 | 订单已退款状态 |

### 审核状态 (audit_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 待审核 | 待审核状态 |
| 1 | 审核通过 | 审核通过状态 |
| 2 | 审核拒绝 | 审核拒绝状态 |

### 会员等级 (member_level)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 普通会员 | 普通会员等级 |
| 2 | 银卡会员 | 银卡会员等级 |
| 3 | 金卡会员 | 金卡会员等级 |
| 4 | 钻石会员 | 钻石会员等级 |

### 风险等级 (risk_level)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 低风险 | 低风险等级 |
| 2 | 中风险 | 中风险等级 |
| 3 | 高风险 | 高风险等级 |
| 4 | 极高风险 | 极高风险等级 |

### 支付状态 (payment_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 未支付 | 未支付状态 |
| 1 | 已支付 | 已支付状态 |
| 2 | 已退款 | 已退款状态 |

### 发票状态 (invoice_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 待开票 | 待开票状态 |
| 2 | 已开票 | 已开票状态 |
| 3 | 已作废 | 已作废状态 |

### 项目状态 (project_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 未开始 | 项目未开始状态 |
| 2 | 进行中 | 项目进行中状态 |
| 3 | 已暂停 | 项目已暂停状态 |
| 4 | 已完成 | 项目已完成状态 |
| 5 | 已取消 | 项目已取消状态 |

### 工单状态 (work_order_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 待分配 | 工单待分配状态 |
| 2 | 待处理 | 工单待处理状态 |
| 3 | 处理中 | 工单处理中状态 |
| 4 | 已完成 | 工单已完成状态 |
| 5 | 已关闭 | 工单已关闭状态 |

### 线索状态 (lead_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 新线索 | 新线索状态 |
| 2 | 跟进中 | 跟进中状态 |
| 3 | 已转化 | 已转化状态 |
| 4 | 已失效 | 已失效状态 |

### 合同状态 (contract_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 草稿 | 合同草稿状态 |
| 2 | 审批中 | 合同审批中状态 |
| 3 | 生效中 | 合同生效中状态 |
| 4 | 已完成 | 合同已完成状态 |
| 5 | 已作废 | 合同已作废状态 |

### 资产状态 (asset_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 在用 | 资产在用状态 |
| 2 | 闲置 | 资产闲置状态 |
| 3 | 维修 | 资产维修状态 |
| 4 | 报废 | 资产报废状态 |

### 用户状态 (user_status)

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 禁用 | 用户禁用状态 |
| 1 | 启用 | 用户启用状态 |
| 2 | 锁定 | 用户锁定状态 |

### 预警级别 (alert_level)

| 值 | 名称 | 说明 |
|----|------|------|
| 1 | 提示 | 提示级别 |
| 2 | 警告 | 警告级别 |
| 3 | 严重 | 严重级别 |
| 4 | 紧急 | 紧急级别 |

---

## 🔧 维护说明

### 备份策略

- **全量备份**: 每日凌晨2:00自动执行
- **增量备份**: 每4小时执行一次
- **备份保留**: 30天
- **备份路径**: /Volume2/MySQL/backup/

### 性能优化建议

1. **索引优化**: 确保常用查询字段建立索引
2. **分区策略**: 大表按时间分区
3. **缓存配置**: 使用Redis缓存热点数据
4. **连接池**: 配置合理的连接池参数

### 安全建议

1. **密码策略**: 定期更换数据库密码
2. **权限控制**: 遵循最小权限原则
3. **审计日志**: 开启操作审计
4. **数据脱敏**: 敏感数据加密存储

### 监控指标

- 连接数监控
- 慢查询监控
- 锁等待监控
- 表空间监控
- 主从延迟监控

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| [database_variables.json](./database_variables.json) | JSON格式变量配置 |
| [.env.database](./.env.database) | 环境变量配置 |
| [database_types.ts](./database_types.ts) | TypeScript类型定义 |
| [database_config.py](./database_config.py) | Python配置模块 |
| [13-导航架构补充.sql](./13-导航架构补充.sql) | 补充表SQL脚本 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
