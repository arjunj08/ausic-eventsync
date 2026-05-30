package com.example.auisceventsync.data

import kotlinx.coroutines.flow.Flow

class DataRepository(private val dao: EventSyncDao) {

    // --- Users ---
    val allUsers: Flow<List<UserEntity>> = dao.getAllUsersFlow()
    suspend fun getUserByEmail(email: String): UserEntity? = dao.getUserByEmail(email)
    suspend fun getUserById(id: Int): UserEntity? = dao.getUserById(id)
    suspend fun insertUser(user: UserEntity): Long = dao.insertUser(user)
    suspend fun updateUser(user: UserEntity) = dao.updateUser(user)

    // --- Teams ---
    val allTeams: Flow<List<TeamEntity>> = dao.getAllTeamsFlow()
    suspend fun getTeamById(id: Int): TeamEntity? = dao.getTeamById(id)
    suspend fun insertTeam(team: TeamEntity): Long = dao.insertTeam(team)
    suspend fun updateTeam(team: TeamEntity) = dao.updateTeam(team)

    // --- Events ---
    val allEvents: Flow<List<EventEntity>> = dao.getAllEventsFlow()
    suspend fun getEventById(id: Int): EventEntity? = dao.getEventById(id)
    suspend fun insertEvent(event: EventEntity): Long = dao.insertEvent(event)
    suspend fun updateEvent(event: EventEntity) = dao.updateEvent(event)
    suspend fun deleteEvent(event: EventEntity) = dao.deleteEvent(event)

    // --- Tasks ---
    val allTasks: Flow<List<TaskEntity>> = dao.getAllTasksFlow()
    fun getTasksForEvent(eventId: Int): Flow<List<TaskEntity>> = dao.getTasksForEventFlow(eventId)
    suspend fun insertTask(task: TaskEntity): Long = dao.insertTask(task)
    suspend fun updateTask(task: TaskEntity) = dao.updateTask(task)
    suspend fun deleteTaskById(taskId: Int) = dao.deleteTaskById(taskId)

    // --- Recurring Task Templates ---
    val allTemplates: Flow<List<RecurringTemplateEntity>> = dao.getAllTemplatesFlow()
    suspend fun insertTemplate(template: RecurringTemplateEntity): Long = dao.insertTemplate(template)
    suspend fun updateTemplate(template: RecurringTemplateEntity) = dao.updateTemplate(template)

    // --- Expenses ---
    val allExpenses: Flow<List<ExpenseEntity>> = dao.getAllExpensesFlow()
    suspend fun insertExpense(expense: ExpenseEntity): Long = dao.insertExpense(expense)
    suspend fun updateExpense(expense: ExpenseEntity) = dao.updateExpense(expense)

    // --- Cross Team Requests ---
    val allRequests: Flow<List<CrossTeamRequestEntity>> = dao.getAllRequestsFlow()
    suspend fun insertRequest(request: CrossTeamRequestEntity): Long = dao.insertRequest(request)
    suspend fun updateRequest(request: CrossTeamRequestEntity) = dao.updateRequest(request)

    // --- Notifications ---
    fun getNotificationsForUser(userId: Int): Flow<List<NotificationEntity>> = dao.getNotificationsForUserFlow(userId)
    suspend fun insertNotification(notification: NotificationEntity): Long = dao.insertNotification(notification)
    suspend fun markAllNotificationsRead(userId: Int) = dao.markAllNotificationsRead(userId)
    suspend fun markNotificationRead(id: Int) = dao.markNotificationRead(id)

    // --- Chat Messages ---
    fun getMessagesForRoom(roomId: String): Flow<List<ChatMessageEntity>> = dao.getMessagesForRoomFlow(roomId)
    suspend fun insertChatMessage(message: ChatMessageEntity): Long = dao.insertChatMessage(message)

    // --- Calls ---
    suspend fun getActiveCallForRoom(roomId: String): CallEntity? = dao.getActiveCallForRoom(roomId)
    suspend fun insertCall(call: CallEntity): Long = dao.insertCall(call)
    suspend fun updateCall(call: CallEntity) = dao.updateCall(call)
}
