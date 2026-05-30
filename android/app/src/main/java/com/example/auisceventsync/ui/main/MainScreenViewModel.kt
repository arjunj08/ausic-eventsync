package com.example.auisceventsync.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.auisceventsync.data.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainScreenViewModel(private val repository: DataRepository) : ViewModel() {

    // --- Active Session States ---
    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser: StateFlow<UserEntity?> = _currentUser.asStateFlow()

    private val _activeTab = MutableStateFlow(0) // 0 to 4 (Events, Squads, Tasks, Ledger, Collaboration)
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    private val _activeCall = MutableStateFlow<CallEntity?>(null) // Voice/Video simulated WebRTC active call
    val activeCall: StateFlow<CallEntity?> = _activeCall.asStateFlow()

    private val _activeChatRoomId = MutableStateFlow<String?>(null) // Currently selected chat roomId
    val activeChatRoomId: StateFlow<String?> = _activeChatRoomId.asStateFlow()

    private val _incomingCallNotif = MutableStateFlow<CallEntity?>(null) // Popup banner state
    val incomingCallNotif: StateFlow<CallEntity?> = _incomingCallNotif.asStateFlow()

    // --- Room Database Streams ---
    val allUsers: StateFlow<List<UserEntity>> = repository.allUsers
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTeams: StateFlow<List<TeamEntity>> = repository.allTeams
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allEvents: StateFlow<List<EventEntity>> = repository.allEvents
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTasks: StateFlow<List<TaskEntity>> = repository.allTasks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTemplates: StateFlow<List<RecurringTemplateEntity>> = repository.allTemplates
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allExpenses: StateFlow<List<ExpenseEntity>> = repository.allExpenses
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allRequests: StateFlow<List<CrossTeamRequestEntity>> = repository.allRequests
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Notifications & Chat Messages list dynamically based on active user/room
    val activeNotifications: StateFlow<List<NotificationEntity>> = currentUser
        .flatMapLatest { user ->
            if (user != null) repository.getNotificationsForUser(user.id)
            else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val activeChatMessages: StateFlow<List<ChatMessageEntity>> = activeChatRoomId
        .flatMapLatest { roomId ->
            if (roomId != null) repository.getMessagesForRoom(roomId)
            else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Authentication Actions ---
    fun login(email: String, passwordHash: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val user = repository.getUserByEmail(email)
            if (user != null && user.passwordHash == passwordHash) {
                _currentUser.value = user
                onResult(true, "Login successful")
            } else {
                onResult(false, "Invalid email or password")
            }
        }
    }

    fun register(name: String, email: String, passwordHash: String, role: String, teamId: Int?, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val existing = repository.getUserByEmail(email)
            if (existing != null) {
                onResult(false, "Email already registered")
                return@launch
            }

            val avatar = if (name.length >= 2) name.substring(0, 2).uppercase() else name.uppercase()
            val user = UserEntity(
                name = name,
                email = email,
                passwordHash = passwordHash,
                role = role,
                teamId = teamId,
                avatar = avatar
            )
            val newId = repository.insertUser(user)
            _currentUser.value = user.copy(id = newId.toInt())
            onResult(true, "Registration successful")
        }
    }

    fun logout() {
        _currentUser.value = null
        _activeTab.value = 0
        _activeChatRoomId.value = null
        _activeCall.value = null
        _incomingCallNotif.value = null
    }

    // --- Quick Switcher Dropdown Action ---
    fun quickSwitchUser(userId: Int) {
        viewModelScope.launch {
            val user = repository.getUserById(userId)
            if (user != null) {
                _currentUser.value = user
                _activeChatRoomId.value = null
                _activeCall.value = null
                _incomingCallNotif.value = null
            }
        }
    }

    // --- Event Actions (Admin only check implemented in UI) ---
    fun createEvent(title: String, description: String, date: Long, imageUrl: String, status: String, teamIdsString: String) {
        viewModelScope.launch {
            val creatorId = _currentUser.value?.id ?: 1
            repository.insertEvent(
                EventEntity(
                    title = title,
                    description = description,
                    date = date,
                    imageUrl = imageUrl,
                    status = status,
                    teamIdsString = teamIdsString,
                    createdBy = creatorId
                )
            )
        }
    }

    fun deleteEvent(event: EventEntity) {
        viewModelScope.launch {
            repository.deleteEvent(event)
        }
    }

    fun publishEvent(event: EventEntity) {
        viewModelScope.launch {
            repository.updateEvent(event.copy(status = "published"))
            // Send system notification to all members
            val members = allUsers.value.filter { it.role == "member" }
            members.forEach { m ->
                repository.insertNotification(
                    NotificationEntity(
                        userId = m.id,
                        type = "event",
                        message = "New event '${event.title}' published by club coordinators.",
                        read = false
                    )
                )
            }
        }
    }

    // --- Task Actions ---
    fun createTask(title: String, description: String, teamId: Int, eventId: Int, assignedTo: Int?) {
        viewModelScope.launch {
            repository.insertTask(
                TaskEntity(
                    title = title,
                    description = description,
                    status = "todo",
                    assignedTo = assignedTo,
                    teamId = teamId,
                    eventId = eventId
                )
            )
            // Notify assigned member
            if (assignedTo != null) {
                repository.insertNotification(
                    NotificationEntity(
                        userId = assignedTo,
                        type = "task",
                        message = "New task assigned: '$title'. Check your Task Board.",
                        read = false
                    )
                )
            }
        }
    }

    fun updateTaskStatus(task: TaskEntity, newStatus: String) {
        viewModelScope.launch {
            repository.updateTask(task.copy(status = newStatus))
        }
    }

    fun deleteTask(taskId: Int) {
        viewModelScope.launch {
            repository.deleteTaskById(taskId)
        }
    }

    // --- Recurring Task Template Actions ---
    fun createTemplate(title: String, description: String, frequency: String, teamId: Int) {
        viewModelScope.launch {
            val creatorId = _currentUser.value?.id ?: 1
            repository.insertTemplate(
                RecurringTemplateEntity(
                    title = title,
                    description = description,
                    frequency = frequency,
                    teamId = teamId,
                    createdBy = creatorId,
                    isActive = true
                )
            )
        }
    }

    fun toggleTemplateActive(template: RecurringTemplateEntity) {
        viewModelScope.launch {
            repository.updateTemplate(template.copy(isActive = !template.isActive))
            
            // If newly active, trigger auto task generation
            if (!template.isActive) {
                // Fetch default event for team
                val teamsList = allTeams.value
                val teamObj = teamsList.find { it.id == template.teamId }
                val eventId = teamObj?.eventId ?: 1
                
                repository.insertTask(
                    TaskEntity(
                        title = "[Recurring] ${template.title}",
                        description = template.description,
                        status = "todo",
                        assignedTo = null,
                        teamId = template.teamId,
                        eventId = eventId
                    )
                )
            }
        }
    }

    // --- Expense Ledger Actions ---
    fun submitExpense(title: String, amount: Double, category: String, eventId: Int, teamId: Int) {
        viewModelScope.launch {
            val submitterId = _currentUser.value?.id ?: 1
            repository.insertExpense(
                ExpenseEntity(
                    title = title,
                    amount = amount,
                    category = category,
                    eventId = eventId,
                    teamId = teamId,
                    submittedBy = submitterId,
                    status = "pending",
                    receiptUrl = ""
                )
            )
        }
    }

    fun approveExpense(expense: ExpenseEntity) {
        viewModelScope.launch {
            repository.updateExpense(expense.copy(status = "approved"))
            repository.insertNotification(
                NotificationEntity(
                    userId = expense.submittedBy,
                    type = "expense",
                    message = "Your expense request of ₹${expense.amount} for '${expense.title}' was approved.",
                    read = false
                )
            )
        }
    }

    fun rejectExpense(expense: ExpenseEntity) {
        viewModelScope.launch {
            repository.updateExpense(expense.copy(status = "rejected"))
            repository.insertNotification(
                NotificationEntity(
                    userId = expense.submittedBy,
                    type = "expense",
                    message = "Your expense request of ₹${expense.amount} for '${expense.title}' was declined.",
                    read = false
                )
            )
        }
    }

    // --- Cross-Team Request Actions ---
    fun submitCrossTeamRequest(toTeamId: Int, message: String) {
        viewModelScope.launch {
            val sender = _currentUser.value ?: return@launch
            val fromTeamId = sender.teamId ?: return@launch
            
            repository.insertRequest(
                CrossTeamRequestEntity(
                    fromTeamId = fromTeamId,
                    toTeamId = toTeamId,
                    message = message,
                    status = "pending",
                    createdBy = sender.id
                )
            )

            // Notify all members of the target team
            val targetTeamMembers = allUsers.value.filter { it.teamId == toTeamId }
            targetTeamMembers.forEach { m ->
                repository.insertNotification(
                    NotificationEntity(
                        userId = m.id,
                        type = "request",
                        message = "New cross-team collaboration request received.",
                        read = false
                    )
                )
            }
        }
    }

    fun updateRequestStatus(request: CrossTeamRequestEntity, newStatus: String) {
        viewModelScope.launch {
            repository.updateRequest(request.copy(status = newStatus))
            // Notify creator
            repository.insertNotification(
                NotificationEntity(
                    userId = request.createdBy,
                    type = "request",
                    message = "Your cross-team request has been $newStatus.",
                    read = false
                )
            )
        }
    }

    // --- Chat Room Messaging & Live Peer Simulator ---
    fun setChatRoomId(roomId: String?) {
        _activeChatRoomId.value = roomId
    }

    fun sendChatMessage(messageText: String) {
        val sender = _currentUser.value ?: return
        val roomId = _activeChatRoomId.value ?: return

        viewModelScope.launch {
            repository.insertChatMessage(
                ChatMessageEntity(
                    roomId = roomId,
                    senderId = sender.id,
                    senderName = sender.name,
                    message = messageText
                )
            )
            
            // Trigger Automated Peer Response Sequence (Simulated delayed chat)
            simulatePeerResponse(roomId, messageText)
        }
    }

    private suspend fun simulatePeerResponse(roomId: String, userMessage: String) {
        delay(1500) // Delay 1.5 seconds

        val peerUser = if (roomId.startsWith("team_")) {
            // Find another user in the same team
            val teamId = roomId.substringAfter("team_").toInt()
            allUsers.value.find { it.teamId == teamId && it.id != _currentUser.value?.id }
        } else {
            // It's a DM, find the recipient user ID
            // Format: "dm_1_2" where user.id is one of them
            val ids = roomId.substringAfter("dm_").split("_").map { it.toInt() }
            val recipientId = ids.find { it != _currentUser.value?.id } ?: return
            allUsers.value.find { it.id == recipientId }
        } ?: return

        val responseText = when {
            userMessage.contains("task", ignoreCase = true) -> "I'm on it! Will update the progress board shortly."
            userMessage.contains("event", ignoreCase = true) -> "Got the event schedule. Coordination checks are green."
            userMessage.contains("expense", ignoreCase = true) -> "Let's submit the slides, we'll double check expenditure codes."
            else -> "Acknowledged. Let's sync up on the dashboard tasks."
        }

        repository.insertChatMessage(
            ChatMessageEntity(
                roomId = roomId,
                senderId = peerUser.id,
                senderName = peerUser.name,
                message = responseText
            )
        )
    }

    // --- Simulated WebRTC Call Actions ---
    fun initiateCall(roomId: String, isVideo: Boolean) {
        viewModelScope.launch {
            val initiatorId = _currentUser.value?.id ?: 1
            
            // Generate list of participants string (everyone in room except initiator)
            val participants = if (roomId.startsWith("team_")) {
                val tId = roomId.substringAfter("team_").toInt()
                allUsers.value.filter { it.teamId == tId && it.id != initiatorId }.map { it.id }
            } else {
                val ids = roomId.substringAfter("dm_").split("_").map { it.toInt() }
                ids.filter { it != initiatorId }
            }
            
            val call = CallEntity(
                roomId = roomId,
                initiatedBy = initiatorId,
                participantsString = participants.joinToString(","),
                status = "active",
                isVideo = isVideo,
                endedAt = null
            )
            val newCallId = repository.insertCall(call)
            val activeCallObj = call.copy(id = newCallId.toInt())
            _activeCall.value = activeCallObj

            // Broadcast incoming call notification to other participants in Room
            participants.forEach { pId ->
                repository.insertNotification(
                    NotificationEntity(
                        userId = pId,
                        type = "call",
                        message = "Incoming huddle call from ${_currentUser.value?.name}.",
                        read = false
                    )
                )
            }
        }
    }

    fun receiveIncomingCall(call: CallEntity) {
        _incomingCallNotif.value = call
    }

    fun acceptIncomingCall() {
        val call = _incomingCallNotif.value ?: return
        _activeCall.value = call
        _incomingCallNotif.value = null
    }

    fun declineIncomingCall() {
        val call = _incomingCallNotif.value ?: return
        viewModelScope.launch {
            repository.updateCall(call.copy(status = "ended", endedAt = System.currentTimeMillis()))
        }
        _incomingCallNotif.value = null
    }

    fun endCall() {
        val call = _activeCall.value ?: return
        viewModelScope.launch {
            repository.updateCall(call.copy(status = "ended", endedAt = System.currentTimeMillis()))
        }
        _activeCall.value = null
    }

    fun setTab(index: Int) {
        _activeTab.value = index
    }
}
