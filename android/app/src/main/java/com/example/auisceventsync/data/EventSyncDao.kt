package com.example.auisceventsync.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import kotlinx.coroutines.flow.Flow

@Dao
interface EventSyncDao {

    // --- Users ---
    @Query("SELECT * FROM users")
    fun getAllUsersFlow(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    suspend fun getUserById(id: Int): UserEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity): Long

    @Update
    suspend fun updateUser(user: UserEntity)

    // --- Teams ---
    @Query("SELECT * FROM teams")
    fun getAllTeamsFlow(): Flow<List<TeamEntity>>

    @Query("SELECT * FROM teams WHERE id = :id LIMIT 1")
    suspend fun getTeamById(id: Int): TeamEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTeam(team: TeamEntity): Long

    @Update
    suspend fun updateTeam(team: TeamEntity)

    // --- Events ---
    @Query("SELECT * FROM events")
    fun getAllEventsFlow(): Flow<List<EventEntity>>

    @Query("SELECT * FROM events WHERE id = :id LIMIT 1")
    suspend fun getEventById(id: Int): EventEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: EventEntity): Long

    @Update
    suspend fun updateEvent(event: EventEntity)

    @Delete
    suspend fun deleteEvent(event: EventEntity)

    // --- Tasks ---
    @Query("SELECT * FROM tasks")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE eventId = :eventId")
    fun getTasksForEventFlow(eventId: Int): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity): Long

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :taskId")
    suspend fun deleteTaskById(taskId: Int)

    // --- Recurring Task Templates ---
    @Query("SELECT * FROM recurring_templates")
    fun getAllTemplatesFlow(): Flow<List<RecurringTemplateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplate(template: RecurringTemplateEntity): Long

    @Update
    suspend fun updateTemplate(template: RecurringTemplateEntity)

    // --- Expenses ---
    @Query("SELECT * FROM expenses")
    fun getAllExpensesFlow(): Flow<List<ExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity): Long

    @Update
    suspend fun updateExpense(expense: ExpenseEntity)

    // --- Cross Team Requests ---
    @Query("SELECT * FROM cross_team_requests")
    fun getAllRequestsFlow(): Flow<List<CrossTeamRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRequest(request: CrossTeamRequestEntity): Long

    @Update
    suspend fun updateRequest(request: CrossTeamRequestEntity)

    // --- Notifications ---
    @Query("SELECT * FROM notifications WHERE userId = :userId ORDER BY createdAt DESC")
    fun getNotificationsForUserFlow(userId: Int): Flow<List<NotificationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity): Long

    @Query("UPDATE notifications SET read = 1 WHERE userId = :userId")
    suspend fun markAllNotificationsRead(userId: Int)

    @Query("UPDATE notifications SET read = 1 WHERE id = :id")
    suspend fun markNotificationRead(id: Int)

    // --- Chat Messages ---
    @Query("SELECT * FROM chat_messages WHERE roomId = :roomId ORDER BY timestamp ASC")
    fun getMessagesForRoomFlow(roomId: String): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChatMessage(message: ChatMessageEntity): Long

    // --- Calls ---
    @Query("SELECT * FROM calls WHERE roomId = :roomId AND status = 'active' LIMIT 1")
    suspend fun getActiveCallForRoom(roomId: String): CallEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCall(call: CallEntity): Long

    @Update
    suspend fun updateCall(call: CallEntity)
}
