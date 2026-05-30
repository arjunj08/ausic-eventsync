package com.example.auisceventsync.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        UserEntity::class,
        EventEntity::class,
        TeamEntity::class,
        TaskEntity::class,
        RecurringTemplateEntity::class,
        ExpenseEntity::class,
        CrossTeamRequestEntity::class,
        NotificationEntity::class,
        ChatMessageEntity::class,
        CallEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class EventSyncDatabase : RoomDatabase() {

    abstract fun eventSyncDao(): EventSyncDao

    companion object {
        @Volatile
        private var INSTANCE: EventSyncDatabase? = null

        fun getDatabase(context: Context): EventSyncDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    EventSyncDatabase::class.java,
                    "auisc_eventsync_database"
                )
                .addCallback(DatabaseCallback(context))
                .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class DatabaseCallback(
        private val context: Context
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                CoroutineScope(Dispatchers.IO).launch {
                    val dao = database.eventSyncDao()
                    seedDatabase(dao)
                }
            }
        }

        private suspend fun seedDatabase(dao: EventSyncDao) {
            // 1. Seed Teams
            val designTeamId = dao.insertTeam(TeamEntity(id = 1, name = "Design Squad", color = "#7C3AED", memberIdsString = "2,3", eventId = 1))
            val devTeamId = dao.insertTeam(TeamEntity(id = 2, name = "Dev Force", color = "#00BFFF", memberIdsString = "1,4", eventId = 1))
            val mediaTeamId = dao.insertTeam(TeamEntity(id = 3, name = "Media Team", color = "#FF6B00", memberIdsString = "5", eventId = 2))

            // 2. Seed Users
            // Arjun (Admin) - arjun08j@gmail.com
            // Sanjay (Dev) - sanjay@auisc.org (team: Dev Force)
            // Nikitha (Design) - nikitha@auisc.org (team: Design Squad)
            // Rahul (Media) - rahul@auisc.org (team: Media Team)
            val adminId = dao.insertUser(UserEntity(id = 1, name = "Arjun (Admin)", email = "arjun08j@gmail.com", passwordHash = "password123", role = "admin", teamId = null, avatar = "AJ"))
            val m1Id = dao.insertUser(UserEntity(id = 2, name = "Sanjay", email = "sanjay@auisc.com", passwordHash = "password123", role = "member", teamId = 2, avatar = "SJ"))
            val m2Id = dao.insertUser(UserEntity(id = 3, name = "Nikitha", email = "nikitha@auisc.com", passwordHash = "password123", role = "member", teamId = 1, avatar = "NK"))
            val m3Id = dao.insertUser(UserEntity(id = 4, name = "Rahul", email = "rahul@auisc.com", passwordHash = "password123", role = "member", teamId = 3, avatar = "RH"))

            // Update teams with correct member IDs
            dao.updateTeam(TeamEntity(id = 1, name = "Design Squad", color = "#7C3AED", memberIdsString = "$m2Id", eventId = 1))
            dao.updateTeam(TeamEntity(id = 2, name = "Dev Force", color = "#00BFFF", memberIdsString = "$m1Id", eventId = 1))
            dao.updateTeam(TeamEntity(id = 3, name = "Media Team", color = "#FF6B00", memberIdsString = "$m3Id", eventId = 2))

            // 3. Seed Events
            val event1Id = dao.insertEvent(EventEntity(id = 1, title = "Tech Summit 2026", description = "Flagsip tech exhibition featuring deep tech displays and guest keynotes.", date = System.currentTimeMillis() + 15 * 24 * 3600 * 1000L, imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", status = "published", teamIdsString = "1,2", createdBy = 1))
            val event2Id = dao.insertEvent(EventEntity(id = 2, title = "AUISC Cultural Night", description = "Cultural dance, arts, and music curation night.", date = System.currentTimeMillis() + 50 * 24 * 3600 * 1000L, imageUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800", status = "published", teamIdsString = "1,3", createdBy = 1))
            val event3Id = dao.insertEvent(EventEntity(id = 3, title = "Hackathon 3.0", description = "36-hour local developer coding contest.", date = System.currentTimeMillis() + 70 * 24 * 3600 * 1000L, imageUrl = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800", status = "draft", teamIdsString = "2,3", createdBy = 1))

            // 4. Seed Tasks
            dao.insertTask(TaskEntity(id = 1, title = "Design Event Poster", description = "Draft dark neon flyers for social promotions.", status = "done", assignedTo = 3, teamId = 1, eventId = 1))
            dao.insertTask(TaskEntity(id = 2, title = "Configure WebSockets", description = "Establish real-time chat routing gateways.", status = "in_progress", assignedTo = 2, teamId = 2, eventId = 1))
            dao.insertTask(TaskEntity(id = 3, title = "Cultural Night Slides Layout", description = "Setup standard PPT program schedule slots.", status = "todo", assignedTo = 3, teamId = 1, eventId = 2))
            dao.insertTask(TaskEntity(id = 4, title = "Setup Room DB Entities", description = "Define model structures and migration properties.", status = "todo", assignedTo = 2, teamId = 2, eventId = 1))
            dao.insertTask(TaskEntity(id = 5, title = "Edit Cultural Intro Video", description = "Stitch performance clips together.", status = "in_progress", assignedTo = 4, teamId = 3, eventId = 2))

            // 5. Seed Recurring Templates
            dao.insertTemplate(RecurringTemplateEntity(id = 1, title = "Post Daily Standup Summary", description = "Automated reminder to share daily task blocks on Dev Force chat.", frequency = "daily", teamId = 2, createdBy = 1, isActive = true))
            dao.insertTemplate(RecurringTemplateEntity(id = 2, title = "Weekly Asset Sync", description = "Synchronize asset edits between Design and Media teams.", frequency = "weekly", teamId = 1, createdBy = 1, isActive = true))

            // 6. Seed Expenses
            dao.insertExpense(ExpenseEntity(id = 1, title = "Cable adapters & socket boards", amount = 1500.0, category = "Logistics", eventId = 1, teamId = 2, submittedBy = 2, status = "approved", receiptUrl = ""))
            dao.insertExpense(ExpenseEntity(id = 2, title = "Standee banner prints", amount = 4200.0, category = "Decor", eventId = 2, teamId = 1, submittedBy = 3, status = "pending", receiptUrl = ""))

            // 7. Seed Cross Team Requests
            dao.insertRequest(CrossTeamRequestEntity(id = 1, fromTeamId = 2, toTeamId = 1, message = "Need high resolution background vectors for layout template.", status = "pending", createdBy = 2))

            // 8. Seed Notifications
            dao.insertNotification(NotificationEntity(id = 1, userId = 2, type = "task", message = "You have been assigned: 'Configure WebSockets'.", read = false))
            dao.insertNotification(NotificationEntity(id = 2, userId = 3, type = "task", message = "You have been assigned: 'Design Event Poster'.", read = true))
            dao.insertNotification(NotificationEntity(id = 3, userId = 4, type = "event", message = "New event 'Tech Summit 2026' published.", read = false))

            // 9. Seed Chat Messages
            dao.insertChatMessage(ChatMessageEntity(id = 1, roomId = "team_2", senderId = 1, senderName = "Arjun (Admin)", message = "Team Dev, make sure backend routing handles cookies correctly."))
            dao.insertChatMessage(ChatMessageEntity(id = 2, roomId = "team_2", senderId = 2, senderName = "Sanjay", message = "Acknowledged. WebSockets routing endpoints are structured."))
        }
    }
}
