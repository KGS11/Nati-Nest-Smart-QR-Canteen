-- Operational indexes for dashboard, report, and staff workflow queries.
CREATE INDEX "restaurant_tables_status_idx" ON "restaurant_tables"("status");

CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");
CREATE INDEX "menu_items_isAvailable_idx" ON "menu_items"("isAvailable");

CREATE INDEX "table_sessions_tableId_status_idx" ON "table_sessions"("tableId", "status");
CREATE INDEX "table_sessions_openedAt_idx" ON "table_sessions"("openedAt");
CREATE INDEX "table_sessions_closedAt_idx" ON "table_sessions"("closedAt");

CREATE INDEX "orders_sessionId_status_idx" ON "orders"("sessionId", "status");
CREATE INDEX "orders_status_placedAt_idx" ON "orders"("status", "placedAt");
CREATE INDEX "orders_placedAt_idx" ON "orders"("placedAt");
CREATE INDEX "orders_readyAt_idx" ON "orders"("readyAt");

CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_menuItemId_idx" ON "order_items"("menuItemId");
CREATE INDEX "order_items_status_createdAt_idx" ON "order_items"("status", "createdAt");

CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");
CREATE INDEX "payments_status_verifiedAt_idx" ON "payments"("status", "verifiedAt");
CREATE INDEX "payments_verifiedAt_idx" ON "payments"("verifiedAt");

CREATE INDEX "assistance_requests_sessionId_status_idx" ON "assistance_requests"("sessionId", "status");
CREATE INDEX "assistance_requests_status_createdAt_idx" ON "assistance_requests"("status", "createdAt");

CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");
CREATE INDEX "feedback_rating_idx" ON "feedback"("rating");
