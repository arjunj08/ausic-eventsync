package com.example.auisceventsync.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val email: String,
    val passwordHash: String,
    val role: String, // "admin" or "member"
    val teamId: Int?,
    val avatar: String, // Emoji initials e.g. "👤"
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "events")
data class EventEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val date: Long,
    val imageUrl: String,
    val status: String, // "published" or "draft"
    val teamIdsString: String, // Comma separated IDs
    val createdBy: Int,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "teams")
data class TeamEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val color: String, // Hex color code
    val memberIdsString: String, // Comma separated user IDs
    val eventId: Int?,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val status: String, // "todo", "in_progress", "done"
    val assignedTo: Int?, // User ID
    val teamId: Int, // Team ID
    val eventId: Int, // Event ID
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "recurring_templates")
data class RecurringTemplateEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val frequency: String, // "daily", "weekly", "monthly"
    val teamId: Int,
    val createdBy: Int,
    val isActive: Boolean,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val amount: Double,
    val category: String, // "Food", "Decor", "Logistics", "Prizes"
    val eventId: Int,
    val teamId: Int,
    val submittedBy: Int, // User ID
    val status: String, // "pending", "approved", "rejected"
    val receiptUrl: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "cross_team_requests")
data class CrossTeamRequestEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val fromTeamId: Int,
    val toTeamId: Int,
    val message: String,
    val status: String, // "pending", "accepted", "rejected"
    val createdBy: Int,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val userId: Int,
    val type: String,
    val message: String,
    val read: Boolean,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val roomId: String, // "team_1", "dm_1_2"
    val senderId: Int,
    val senderName: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "calls")
data class CallEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val roomId: String,
    val initiatedBy: Int,
    val participantsString: String,
    val status: String, // "active", "ended"
    val startedAt: Long = System.currentTimeMillis(),
    val endedAt: Long?,
    val isVideo: Boolean
)
