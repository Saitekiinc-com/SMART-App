-- CreateTable
CREATE TABLE "goal_feedback" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "goal_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_feedback_goal_id_key" ON "goal_feedback"("goal_id");

-- AddForeignKey
ALTER TABLE "goal_feedback" ADD CONSTRAINT "goal_feedback_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "smart_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_feedback" ADD CONSTRAINT "goal_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
