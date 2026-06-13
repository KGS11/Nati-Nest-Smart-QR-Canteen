-- CreateTable
CREATE TABLE "daily_menu" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "menuDate" DATE NOT NULL,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedById" TEXT,

    CONSTRAINT "daily_menu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_menu_menuDate_idx" ON "daily_menu"("menuDate");

-- CreateIndex
CREATE INDEX "daily_menu_menuItemId_menuDate_idx" ON "daily_menu"("menuItemId", "menuDate");

-- CreateIndex
CREATE INDEX "daily_menu_menuDate_removedAt_idx" ON "daily_menu"("menuDate", "removedAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_menu_menuItemId_menuDate_key" ON "daily_menu"("menuItemId", "menuDate");

-- AddForeignKey
ALTER TABLE "daily_menu" ADD CONSTRAINT "daily_menu_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menu" ADD CONSTRAINT "daily_menu_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menu" ADD CONSTRAINT "daily_menu_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
