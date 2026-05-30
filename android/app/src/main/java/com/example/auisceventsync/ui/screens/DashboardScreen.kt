package com.example.auisceventsync.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.auisceventsync.data.*
import com.example.auisceventsync.theme.*
import com.example.auisceventsync.ui.components.CallOverlay
import com.example.auisceventsync.ui.main.MainScreenViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: MainScreenViewModel,
    onLogout: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val activeCall by viewModel.activeCall.collectAsState()
    val incomingCallNotif by viewModel.incomingCallNotif.collectAsState()

    val allUsers by viewModel.allUsers.collectAsState()
    val allTeams by viewModel.allTeams.collectAsState()
    val allEvents by viewModel.allEvents.collectAsState()
    val allTasks by viewModel.allTasks.collectAsState()
    val allExpenses by viewModel.allExpenses.collectAsState()
    val allTemplates by viewModel.allTemplates.collectAsState()
    val allRequests by viewModel.allRequests.collectAsState()
    val activeNotifications by viewModel.activeNotifications.collectAsState()

    var showQuickSwitchDropdown by remember { mutableStateOf(false) }

    // Redirect to Login if no user
    if (currentUser == null) {
        LaunchedEffect(Unit) {
            onLogout()
        }
        return
    }

    val userObj = currentUser!!

    // Watch for incoming call from notifications
    LaunchedEffect(activeNotifications) {
        val latestCallNotif = activeNotifications.find { !it.read && it.type == "call" }
        if (latestCallNotif != null) {
            // Find active call for the user
            val calls = viewModel.allRequests.value // wait, we can fetch active call from notification
            // We just trigger simulation of incoming call from viewmodel
            // If the user's team room or DM has an active call, viewmodel will update incomingCallNotif
        }
    }

    // Main Scaffold Layout
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "AUISC EventSync",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryAccent
                        )
                        Text(
                            text = "ISC Coordination Core",
                            fontSize = 10.sp,
                            color = TextGray,
                            letterSpacing = 1.sp
                        )
                    }
                },
                actions = {
                    // Quick User Switcher Panel
                    Box(modifier = Modifier.padding(end = 8.dp)) {
                        Button(
                            onClick = { showQuickSwitchDropdown = true },
                            colors = ButtonDefaults.buttonColors(containerColor = CardBackground),
                            border = BorderStroke(1.dp, PrimaryAccent.copy(alpha = 0.5f)),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = userObj.name.split(" ")[0],
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowDropDown, contentDescription = "Switch", tint = PrimaryAccent)
                        }

                        DropdownMenu(
                            expanded = showQuickSwitchDropdown,
                            onDismissRequest = { showQuickSwitchDropdown = false },
                            modifier = Modifier.background(CardBackground).border(1.dp, DividerGray)
                        ) {
                            DropdownMenuItem(
                                text = { Text("EVALUATOR SWAP-ROLES", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                onClick = {}
                            )
                            Divider(color = DividerGray)
                            allUsers.forEach { usr ->
                                val roleLabel = if (usr.role == "admin") "Admin" else "Member"
                                DropdownMenuItem(
                                    text = {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(usr.name, color = TextWhite, fontSize = 13.sp)
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = roleLabel,
                                                color = if (usr.role == "admin") SuccessGreen else PrimaryAccent,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    },
                                    onClick = {
                                        viewModel.quickSwitchUser(usr.id)
                                        showQuickSwitchDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    // Logout trigger
                    IconButton(onClick = { onLogout() }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Log Out", tint = ErrorRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = PrimaryBackground)
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = PrimaryBackground,
                tonalElevation = 8.dp,
                modifier = Modifier.border(width = (0.5).dp, color = DividerGray, shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            ) {
                val tabs = listOf(
                    Triple("Events", Icons.Default.Event, 0),
                    Triple("Squads", Icons.Default.People, 1),
                    Triple("Tasks", Icons.Default.Assignment, 2),
                    Triple("Finance", Icons.Default.MonetizationOn, 3),
                    Triple("Collab", Icons.Default.Share, 4)
                )

                tabs.forEach { (label, icon, index) ->
                    val isSelected = activeTab == index
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { viewModel.setTab(index) },
                        label = { Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                        icon = { Icon(icon, contentDescription = label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color.Black,
                            selectedTextColor = PrimaryAccent,
                            indicatorColor = PrimaryAccent,
                            unselectedIconColor = TextGray,
                            unselectedTextColor = TextGray
                        )
                    )
                }
            }
        },
        containerColor = PrimaryBackground
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Render active tab body
            when (activeTab) {
                0 -> EventsTab(viewModel = viewModel, isAdmin = userObj.role == "admin", allTeams = allTeams, allEvents = allEvents, allTasks = allTasks)
                1 -> SquadsTab(viewModel = viewModel, allTeams = allTeams, allUsers = allUsers, allTasks = allTasks)
                2 -> TasksTab(viewModel = viewModel, currentUser = userObj, allUsers = allUsers, allTeams = allTeams, allEvents = allEvents, allTasks = allTasks)
                3 -> FinancialTab(viewModel = viewModel, currentUser = userObj, allTeams = allTeams, allEvents = allEvents, allExpenses = allExpenses, allTemplates = allTemplates)
                4 -> CollaborationTab(viewModel = viewModel, currentUser = userObj, allTeams = allTeams, allUsers = allUsers, allRequests = allRequests, allEvents = allEvents, allTasks = allTasks, allExpenses = allExpenses)
            }

            // Real-time Incoming Call Banner Alert Popup Overlay
            incomingCallNotif?.let { incomingCall ->
                val caller = allUsers.find { it.id == incomingCall.initiatedBy }?.name ?: "Unknown Peer"
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(CardBackground, RoundedCornerShape(12.dp))
                        .border(1.dp, PrimaryAccent, RoundedCornerShape(12.dp))
                        .padding(16.dp)
                        .align(Alignment.TopCenter)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "INCOMING HUDDLE CALL",
                            color = PrimaryAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "$caller is requesting a sync in room: ${incomingCall.roomId}",
                            color = TextWhite,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Button(
                                onClick = { viewModel.declineIncomingCall() },
                                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                            ) {
                                Text("DECLINE", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            Button(
                                onClick = { viewModel.acceptIncomingCall() },
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                            ) {
                                Text("JOIN", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Simulated WebRTC full-screen active huddle overlay
            activeCall?.let { call ->
                val callerName = allUsers.find { it.id == call.initiatedBy }?.name ?: "Club Huddle Room"
                CallOverlay(
                    activeCall = call,
                    callerName = callerName,
                    onEndCall = { viewModel.endCall() }
                )
            }
        }
    }
}

// ==========================================
// TAB 1: EVENTS CENTER
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventsTab(
    viewModel: MainScreenViewModel,
    isAdmin: Boolean,
    allTeams: List<TeamEntity>,
    allEvents: List<EventEntity>,
    allTasks: List<TaskEntity>
) {
    var selectedEvent by remember { mutableStateOf<EventEntity?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }

    var newTitle by remember { mutableStateOf("") }
    var newDesc by remember { mutableStateOf("") }
    var newStatus by remember { mutableStateOf("published") } // published, draft
    var selectedTeamIds by remember { mutableStateOf(setOf<Int>()) }

    Box(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        if (selectedEvent == null) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "EVENTS CENTER", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    if (isAdmin) {
                        Button(
                            onClick = { showCreateDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add Event", tint = Color.Black)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("NEW EVENT", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(allEvents) { event ->
                        Card(
                            onClick = { selectedEvent = event },
                            colors = CardDefaults.cardColors(containerColor = CardBackground),
                            border = BorderStroke(1.dp, if (event.status == "draft") SecondaryAccent.copy(alpha = 0.5f) else DividerGray),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = event.title,
                                        color = PrimaryAccent,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    // Status Badge
                                    Box(
                                        modifier = Modifier
                                            .background(
                                                color = if (event.status == "published") SuccessGreen.copy(alpha = 0.15f) else SecondaryAccent.copy(alpha = 0.15f),
                                                shape = RoundedCornerShape(4.dp)
                                            )
                                            .border(
                                                1.dp,
                                                if (event.status == "published") SuccessGreen else SecondaryAccent,
                                                RoundedCornerShape(4.dp)
                                            )
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = event.status.uppercase(),
                                            color = if (event.status == "published") SuccessGreen else SecondaryAccent,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = event.description,
                                    color = TextGray,
                                    fontSize = 13.sp,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Spacer(modifier = Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val dateStr = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(Date(event.date))
                                    Text(text = "📅 $dateStr", color = TextWhite, fontSize = 12.sp)

                                    // Print team tags
                                    val eventTeams = event.teamIdsString.split(",").mapNotNull { it.trim().toIntOrNull() }
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        eventTeams.forEach { tId ->
                                            val tName = allTeams.find { it.id == tId }?.name ?: "Squad"
                                            val tColor = allTeams.find { it.id == tId }?.color ?: "#7C3AED"
                                            Box(
                                                modifier = Modifier
                                                    .background(Color(android.graphics.Color.parseColor(tColor)).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                    .border(0.5.dp, Color(android.graphics.Color.parseColor(tColor)), RoundedCornerShape(4.dp))
                                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                                            ) {
                                                Text(tName.split(" ")[0], color = Color.White, fontSize = 8.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Selected Event Detail Screen
            val event = selectedEvent!!
            val eventTeams = event.teamIdsString.split(",").mapNotNull { it.trim().toIntOrNull() }
            val associatedTasks = allTasks.filter { it.eventId == event.id }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header navigation back
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { selectedEvent = null }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAccent)
                    }
                    if (isAdmin) {
                        Row {
                            if (event.status == "draft") {
                                Button(
                                    onClick = {
                                        viewModel.publishEvent(event)
                                        selectedEvent = event.copy(status = "published")
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                    modifier = Modifier.padding(end = 8.dp)
                                ) {
                                    Text("PUBLISH", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            IconButton(onClick = {
                                viewModel.deleteEvent(event)
                                selectedEvent = null
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete Event", tint = ErrorRed)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(text = event.title, color = PrimaryAccent, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(modifier = Modifier.height(8.dp))
                val dateStr = SimpleDateFormat("EEEE, MMMM dd, yyyy", Locale.getDefault()).format(Date(event.date))
                Text(text = "📅 Schedule: $dateStr", color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    border = BorderStroke(1.dp, DividerGray),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("DESCRIPTION", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = event.description, color = TextWhite, fontSize = 14.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("ASSIGNED COLLABORATOR SQUADS", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    eventTeams.forEach { tId ->
                        val team = allTeams.find { it.id == tId } ?: return@forEach
                        Box(
                            modifier = Modifier
                                .background(Color(android.graphics.Color.parseColor(team.color)).copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                .border(1.dp, Color(android.graphics.Color.parseColor(team.color)), RoundedCornerShape(8.dp))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(team.name, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text("ASSOCIATED SQUAD TASKS (${associatedTasks.size})", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(8.dp))

                if (associatedTasks.isEmpty()) {
                    Text("No tasks associated with this event yet.", color = TextGray, fontSize = 13.sp)
                } else {
                    associatedTasks.forEach { task ->
                        val taskTeam = allTeams.find { it.id == task.teamId }
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardBackground),
                            border = BorderStroke(1.dp, DividerGray),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Task Status Dot Accent
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when (task.status) {
                                                "done" -> SuccessGreen
                                                "in_progress" -> PrimaryAccent
                                                else -> TextGray
                                            }
                                        )
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(task.title, color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = taskTeam?.name ?: "General Task",
                                        color = if (taskTeam != null) Color(android.graphics.Color.parseColor(taskTeam.color)) else TextGray,
                                        fontSize = 11.sp
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .background(DividerGray, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(task.status.uppercase(), color = TextWhite, fontSize = 9.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // CREATE NEW EVENT DIALOG
        if (showCreateDialog) {
            AlertDialog(
                onDismissRequest = { showCreateDialog = false },
                title = { Text("PUBLISH NEW EVENT", color = PrimaryAccent, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = newTitle,
                            onValueChange = { newTitle = it },
                            label = { Text("Event Title", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )
                        OutlinedTextField(
                            value = newDesc,
                            onValueChange = { newDesc = it },
                            label = { Text("Description", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )
                        
                        Text("Assign to Squads:", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        allTeams.forEach { team ->
                            val isChecked = selectedTeamIds.contains(team.id)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedTeamIds = if (isChecked) selectedTeamIds - team.id else selectedTeamIds + team.id
                                    }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = {
                                        selectedTeamIds = if (isChecked) selectedTeamIds - team.id else selectedTeamIds + team.id
                                    }
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(team.name, color = TextWhite, fontSize = 14.sp)
                            }
                        }

                        // Publish vs Draft dropdown
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Save as Draft:", color = TextWhite, fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Switch(
                                checked = newStatus == "draft",
                                onCheckedChange = { isDraft ->
                                    newStatus = if (isDraft) "draft" else "published"
                                }
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newTitle.isNotBlank() && selectedTeamIds.isNotEmpty()) {
                                val teamsStr = selectedTeamIds.joinToString(",")
                                viewModel.createEvent(
                                    title = newTitle,
                                    description = newDesc,
                                    date = System.currentTimeMillis() + 10 * 24 * 3600 * 1000L, // 10 days out default
                                    imageUrl = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
                                    status = newStatus,
                                    teamIdsString = teamsStr
                                )
                                // reset inputs
                                newTitle = ""
                                newDesc = ""
                                selectedTeamIds = emptySet()
                                showCreateDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                    ) {
                        Text("CREATE", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCreateDialog = false }) {
                        Text("CANCEL", color = ErrorRed)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}

// ==========================================
// TAB 2: MEMBERS & SQUADS
// ==========================================
@Composable
fun SquadsTab(
    viewModel: MainScreenViewModel,
    allTeams: List<TeamEntity>,
    allUsers: List<UserEntity>,
    allTasks: List<TaskEntity>
) {
    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Text(text = "MEMBERS & SQUADS", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            items(allTeams) { team ->
                val teamColor = Color(android.graphics.Color.parseColor(team.color))
                val members = allUsers.filter { it.teamId == team.id }

                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    border = BorderStroke(1.5.dp, teamColor.copy(alpha = 0.7f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = team.name,
                                color = teamColor,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Box(
                                modifier = Modifier
                                    .background(teamColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                    .border(1.dp, teamColor, RoundedCornerShape(4.dp))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "${members.size} ACTIVE MEMBERS",
                                    color = TextWhite,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Members list breakdown
                        members.forEach { member ->
                            val memberTasks = allTasks.filter { it.assignedTo == member.id }
                            val pendingTasks = memberTasks.filter { it.status != "done" }.size
                            val completedTasks = memberTasks.size - pendingTasks

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Avatar circle with neon border
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryBackground)
                                        .border(1.dp, teamColor, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = member.avatar,
                                        color = teamColor,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(member.name, color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Row {
                                        Text(text = "Pending: $pendingTasks", color = TextGray, fontSize = 11.sp)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(text = "Done: $completedTasks", color = SuccessGreen, fontSize = 11.sp)
                                    }
                                }

                                // Open direct DM huddle option
                                IconButton(
                                    onClick = {
                                        // Compute room ID
                                        val curUser = viewModel.currentUser.value ?: return@IconButton
                                        val roomId = if (curUser.id < member.id) "dm_${curUser.id}_${member.id}" else "dm_${member.id}_${curUser.id}"
                                        viewModel.setChatRoomId(roomId)
                                        viewModel.setTab(4) // Switch to collab hub
                                    }
                                ) {
                                    Icon(Icons.Default.Forum, contentDescription = "Message", tint = PrimaryAccent)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// TAB 3: TASKS BOARD (KANBAN)
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksTab(
    viewModel: MainScreenViewModel,
    currentUser: UserEntity,
    allUsers: List<UserEntity>,
    allTeams: List<TeamEntity>,
    allEvents: List<EventEntity>,
    allTasks: List<TaskEntity>
) {
    var showAddTaskDialog by remember { mutableStateOf(false) }
    var taskTitle by remember { mutableStateOf("") }
    var taskDesc by remember { mutableStateOf("") }
    var selectedTeamId by remember { mutableStateOf(1) }
    var selectedEventId by remember { mutableStateOf(1) }
    var selectedAssigneeId by remember { mutableStateOf<Int?>(null) }

    var selectedStatusTab by remember { mutableStateOf(0) } // 0: Todo, 1: In Progress, 2: Done

    val teamObj = allTeams.find { it.id == selectedTeamId }
    val eligibleMembers = allUsers.filter { it.teamId == selectedTeamId }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "TASKS CHECKLISTS", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            // Admins can create tasks
            if (currentUser.role == "admin") {
                Button(
                    onClick = { showAddTaskDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "New Task", tint = Color.Black)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("ADD TASK", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Toggle Scrum Column Switcher Tabs
        TabRow(
            selectedTabIndex = selectedStatusTab,
            containerColor = PrimaryBackground,
            contentColor = PrimaryAccent,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedStatusTab]),
                    color = PrimaryAccent
                )
            }
        ) {
            Tab(selected = selectedStatusTab == 0, onClick = { selectedStatusTab = 0 }) {
                Text("TODO", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = if (selectedStatusTab == 0) PrimaryAccent else TextGray)
            }
            Tab(selected = selectedStatusTab == 1, onClick = { selectedStatusTab = 1 }) {
                Text("IN PROGRESS", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = if (selectedStatusTab == 1) PrimaryAccent else TextGray)
            }
            Tab(selected = selectedStatusTab == 2, onClick = { selectedStatusTab = 2 }) {
                Text("DONE", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = if (selectedStatusTab == 2) SuccessGreen else TextGray)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        val filteredTasks = allTasks.filter {
            val taskState = it.status.lowercase()
            when (selectedStatusTab) {
                0 -> taskState == "todo"
                1 -> taskState == "in_progress"
                else -> taskState == "done"
            }
        }

        if (filteredTasks.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No active tasks in this column.", color = TextGray, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredTasks) { task ->
                    val team = allTeams.find { it.id == task.teamId }
                    val assignee = allUsers.find { it.id == task.assignedTo }
                    val eventObj = allEvents.find { it.id == task.eventId }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, DividerGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = task.title,
                                    color = TextWhite,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                // Quick action for status upgrade
                                if (currentUser.role == "admin" || currentUser.id == task.assignedTo) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        if (task.status == "todo") {
                                            IconButton(onClick = { viewModel.updateTaskStatus(task, "in_progress") }) {
                                                Icon(Icons.Default.PlayArrow, contentDescription = "Start", tint = PrimaryAccent)
                                            }
                                        }
                                        if (task.status == "in_progress") {
                                            IconButton(onClick = { viewModel.updateTaskStatus(task, "done") }) {
                                                Icon(Icons.Default.Check, contentDescription = "Complete", tint = SuccessGreen)
                                            }
                                        }
                                        if (currentUser.role == "admin") {
                                            IconButton(onClick = { viewModel.deleteTask(task.id) }) {
                                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed)
                                            }
                                        }
                                    }
                                }
                            }

                            Text(task.description, color = TextGray, fontSize = 12.sp)

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    // Team tag
                                    team?.let { t ->
                                        Box(
                                            modifier = Modifier
                                                .background(Color(android.graphics.Color.parseColor(t.color)).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                                .border(0.5.dp, Color(android.graphics.Color.parseColor(t.color)), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(t.name, color = Color.White, fontSize = 9.sp)
                                        }
                                    }
                                    // Event tag
                                    eventObj?.let { ev ->
                                        Box(
                                            modifier = Modifier
                                                .background(SecondaryAccent.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                                .border(0.5.dp, SecondaryAccent, RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(ev.title, color = Color.White, fontSize = 9.sp)
                                        }
                                    }
                                }

                                // Assignee Avatar
                                assignee?.let {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(it.name.split(" ")[0], color = TextGray, fontSize = 10.sp, modifier = Modifier.padding(end = 4.dp))
                                        Box(
                                            modifier = Modifier
                                                .size(24.dp)
                                                .clip(CircleShape)
                                                .background(PrimaryAccent.copy(alpha = 0.2f))
                                                .border(0.5.dp, PrimaryAccent, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(it.avatar, color = PrimaryAccent, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                } ?: Text("Unassigned", color = TextGray, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }

        // ADD TASK DIALOG
        if (showAddTaskDialog) {
            AlertDialog(
                onDismissRequest = { showAddTaskDialog = false },
                title = { Text("CREATE SQUAD TASK", color = PrimaryAccent, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = taskTitle,
                            onValueChange = { taskTitle = it },
                            label = { Text("Task Title", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )
                        OutlinedTextField(
                            value = taskDesc,
                            onValueChange = { taskDesc = it },
                            label = { Text("Task Description", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )

                        // Select Squad
                        var showSquadDrop by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = allTeams.find { it.id == selectedTeamId }?.name ?: "Squad",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Target Squad", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Squads", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showSquadDrop = true }
                            )
                            DropdownMenu(
                                expanded = showSquadDrop,
                                onDismissRequest = { showSquadDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                allTeams.forEach { tm ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = tm.name + if (tm.id == selectedTeamId) "  ✓" else "",
                                                color = if (tm.id == selectedTeamId) PrimaryAccent else TextWhite,
                                                fontWeight = if (tm.id == selectedTeamId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            selectedTeamId = tm.id
                                            selectedAssigneeId = null // Reset assignee
                                            showSquadDrop = false
                                        }
                                    )
                                }
                            }
                        }

                        // Select Assignee
                        var showAssigneeDrop by remember { mutableStateOf(false) }
                        val squadMembers = allUsers.filter { it.teamId == selectedTeamId }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            val assigneeName = allUsers.find { it.id == selectedAssigneeId }?.name ?: "Unassigned"
                            OutlinedTextField(
                                value = assigneeName,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Assignee Member", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Assignees", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showAssigneeDrop = true }
                            )
                            DropdownMenu(
                                expanded = showAssigneeDrop,
                                onDismissRequest = { showAssigneeDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = "Unassigned" + if (selectedAssigneeId == null) "  ✓" else "",
                                            color = if (selectedAssigneeId == null) PrimaryAccent else TextWhite,
                                            fontWeight = if (selectedAssigneeId == null) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    onClick = {
                                        selectedAssigneeId = null
                                        showAssigneeDrop = false
                                    }
                                )
                                squadMembers.forEach { mem ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = mem.name + if (mem.id == selectedAssigneeId) "  ✓" else "",
                                                color = if (mem.id == selectedAssigneeId) PrimaryAccent else TextWhite,
                                                fontWeight = if (mem.id == selectedAssigneeId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            selectedAssigneeId = mem.id
                                            showAssigneeDrop = false
                                        }
                                    )
                                }
                            }
                        }

                        // Select Event
                        var showEventDrop by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = allEvents.find { it.id == selectedEventId }?.title ?: "Select Event",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Associated Event", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Events", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showEventDrop = true }
                            )
                            DropdownMenu(
                                expanded = showEventDrop,
                                onDismissRequest = { showEventDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                allEvents.forEach { ev ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = ev.title + if (ev.id == selectedEventId) "  ✓" else "",
                                                color = if (ev.id == selectedEventId) PrimaryAccent else TextWhite,
                                                fontWeight = if (ev.id == selectedEventId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            selectedEventId = ev.id
                                            showEventDrop = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (taskTitle.isNotBlank()) {
                                viewModel.createTask(
                                    title = taskTitle,
                                    description = taskDesc,
                                    teamId = selectedTeamId,
                                    eventId = selectedEventId,
                                    assignedTo = selectedAssigneeId
                                )
                                taskTitle = ""
                                taskDesc = ""
                                showAddTaskDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                    ) {
                        Text("CREATE", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddTaskDialog = false }) {
                        Text("CANCEL", color = ErrorRed)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}

// ==========================================
// TAB 4: TEMPLATES & EXPENSES TRACKER
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinancialTab(
    viewModel: MainScreenViewModel,
    currentUser: UserEntity,
    allTeams: List<TeamEntity>,
    allEvents: List<EventEntity>,
    allExpenses: List<ExpenseEntity>,
    allTemplates: List<RecurringTemplateEntity>
) {
    var showSubmitExpense by remember { mutableStateOf(false) }

    var expTitle by remember { mutableStateOf("") }
    var expAmount by remember { mutableStateOf("") }
    var expCategory by remember { mutableStateOf("Logistics") } // Food, Decor, Logistics, Prizes
    var expEventId by remember { mutableStateOf(1) }
    var expTeamId by remember { mutableStateOf(2) }

    var selectedSectionTab by remember { mutableStateOf(0) } // 0: Expenses, 1: Templates

    val totalSpent = allExpenses.filter { it.status == "approved" }.sumOf { it.amount }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (selectedSectionTab == 0) "LEDGER & EXPENSES" else "RECURRING AUTOMATIONS",
                color = TextWhite,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            if (selectedSectionTab == 0) {
                Button(
                    onClick = { showSubmitExpense = true },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Expense", tint = Color.Black)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("FILE EXPENSE", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Selector Tabs
        TabRow(
            selectedTabIndex = selectedSectionTab,
            containerColor = PrimaryBackground,
            contentColor = PrimaryAccent,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedSectionTab]),
                    color = PrimaryAccent
                )
            }
        ) {
            Tab(selected = selectedSectionTab == 0, onClick = { selectedSectionTab = 0 }) {
                Text("EXPENSES", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = if (selectedSectionTab == 0) PrimaryAccent else TextGray)
            }
            Tab(selected = selectedSectionTab == 1, onClick = { selectedSectionTab = 1 }) {
                Text("RECURRING TEMPLATES", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold, color = if (selectedSectionTab == 1) SecondaryAccent else TextGray)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (selectedSectionTab == 0) {
            // Expenses Ledger Summary Dashboard Card
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = BorderStroke(1.dp, PrimaryAccent.copy(alpha = 0.4f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("APPROVED CLUB INVESTMENT", color = TextGray, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("₹${String.format("%,.2f", totalSpent)}", color = PrimaryAccent, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                    }
                    Icon(
                        imageVector = Icons.Default.TrendingUp,
                        contentDescription = "Chart",
                        tint = SuccessGreen,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }

            // Expenses Lists
            if (allExpenses.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text("No expense requests filed yet.", color = TextGray, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(allExpenses) { expense ->
                        val eventName = allEvents.find { it.id == expense.eventId }?.title ?: "General"
                        val isApproved = expense.status == "approved"
                        val isRejected = expense.status == "rejected"

                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardBackground),
                            border = BorderStroke(1.dp, if (expense.status == "pending") SecondaryAccent.copy(alpha = 0.5f) else DividerGray),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(expense.title, color = TextWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                        Text("Event: $eventName | Category: ${expense.category}", color = TextGray, fontSize = 12.sp)
                                    }
                                    Text(
                                        text = "₹${expense.amount}",
                                        color = if (isApproved) SuccessGreen else if (isRejected) ErrorRed else PrimaryAccent,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Status tag
                                    Box(
                                        modifier = Modifier
                                            .background(
                                                color = when (expense.status) {
                                                    "approved" -> SuccessGreen.copy(alpha = 0.15f)
                                                    "rejected" -> ErrorRed.copy(alpha = 0.15f)
                                                    else -> SecondaryAccent.copy(alpha = 0.15f)
                                                },
                                                shape = RoundedCornerShape(4.dp)
                                            )
                                            .border(
                                                0.5.dp,
                                                when (expense.status) {
                                                    "approved" -> SuccessGreen
                                                    "rejected" -> ErrorRed
                                                    else -> SecondaryAccent
                                                },
                                                RoundedCornerShape(4.dp)
                                            )
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = expense.status.uppercase(),
                                            color = when (expense.status) {
                                                "approved" -> SuccessGreen
                                                "rejected" -> ErrorRed
                                                else -> SecondaryAccent
                                            },
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    // Admin Action Controls
                                    if (currentUser.role == "admin" && expense.status == "pending") {
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Button(
                                                onClick = { viewModel.rejectExpense(expense) },
                                                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Text("DECLINE", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Button(
                                                onClick = { viewModel.approveExpense(expense) },
                                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                                            ) {
                                                Text("APPROVE", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Recurring Task Templates Section
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(allTemplates) { template ->
                    val squad = allTeams.find { it.id == template.teamId }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, DividerGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(template.title, color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text("Frequency: ${template.frequency.uppercase()} | ${squad?.name ?: "Core Team"}", color = TextGray, fontSize = 12.sp)
                                }

                                // Toggle Action Switch
                                Switch(
                                    checked = template.isActive,
                                    onCheckedChange = {
                                        // Toggle active state
                                        viewModel.toggleTemplateActive(template)
                                    },
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = SuccessGreen,
                                        checkedTrackColor = SuccessGreen.copy(alpha = 0.5f)
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(template.description, color = TextGray, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // SUBMIT EXPENSE DIALOG
        if (showSubmitExpense) {
            AlertDialog(
                onDismissRequest = { showSubmitExpense = false },
                title = { Text("FILE SQUAD EXPENDITURE SLIP", color = PrimaryAccent, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = expTitle,
                            onValueChange = { expTitle = it },
                            label = { Text("Expenditure Item / Purpose", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )
                        OutlinedTextField(
                            value = expAmount,
                            onValueChange = { expAmount = it },
                            label = { Text("Total Cost (INR / ₹)", color = TextGray) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite)
                        )

                        // Category Dropdown
                        var showCatDrop by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = expCategory,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Expense Category", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Categories", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showCatDrop = true }
                            )
                            DropdownMenu(
                                expanded = showCatDrop,
                                onDismissRequest = { showCatDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                val categories = listOf("Food", "Decor", "Logistics", "Prizes")
                                categories.forEach { cat ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = cat + if (cat == expCategory) "  ✓" else "",
                                                color = if (cat == expCategory) PrimaryAccent else TextWhite,
                                                fontWeight = if (cat == expCategory) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            expCategory = cat
                                            showCatDrop = false
                                        }
                                    )
                                }
                            }
                        }

                        // Event selector
                        var showEventDrop by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = allEvents.find { it.id == expEventId }?.title ?: "Select Event",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Event Reference", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Events", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showEventDrop = true }
                            )
                            DropdownMenu(
                                expanded = showEventDrop,
                                onDismissRequest = { showEventDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                allEvents.forEach { ev ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = ev.title + if (ev.id == expEventId) "  ✓" else "",
                                                color = if (ev.id == expEventId) PrimaryAccent else TextWhite,
                                                fontWeight = if (ev.id == expEventId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            expEventId = ev.id
                                            showEventDrop = false
                                        }
                                    )
                                }
                            }
                        }

                        // Team selector
                        var showSquadDrop by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = allTeams.find { it.id == expTeamId }?.name ?: "Select Squad",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Billing Squad", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Squads", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showSquadDrop = true }
                            )
                            DropdownMenu(
                                expanded = showSquadDrop,
                                onDismissRequest = { showSquadDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                allTeams.forEach { tm ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = tm.name + if (tm.id == expTeamId) "  ✓" else "",
                                                color = if (tm.id == expTeamId) PrimaryAccent else TextWhite,
                                                fontWeight = if (tm.id == expTeamId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            expTeamId = tm.id
                                            showSquadDrop = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val amount = expAmount.toDoubleOrNull()
                            if (expTitle.isNotBlank() && amount != null) {
                                viewModel.submitExpense(
                                    title = expTitle,
                                    amount = amount,
                                    category = expCategory,
                                    eventId = expEventId,
                                    teamId = expTeamId
                                )
                                expTitle = ""
                                expAmount = ""
                                showSubmitExpense = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                    ) {
                        Text("SUBMIT SLIP", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showSubmitExpense = false }) {
                        Text("CANCEL", color = ErrorRed)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}

// ==========================================
// TAB 5: COLLABORATION HUB (CHAT, REQUESTS, AI BOT)
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollaborationTab(
    viewModel: MainScreenViewModel,
    currentUser: UserEntity,
    allTeams: List<TeamEntity>,
    allUsers: List<UserEntity>,
    allRequests: List<CrossTeamRequestEntity>,
    allEvents: List<EventEntity>,
    allTasks: List<TaskEntity>,
    allExpenses: List<ExpenseEntity>
) {
    var selectedSubTab by remember { mutableStateOf(0) } // 0: Chat Rooms, 1: Cross-Team Requests, 2: EventSync AI

    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        // Sub tabs header
        TabRow(
            selectedTabIndex = selectedSubTab,
            containerColor = PrimaryBackground,
            contentColor = PrimaryAccent,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedSubTab]),
                    color = PrimaryAccent
                )
            }
        ) {
            Tab(selected = selectedSubTab == 0, onClick = { selectedSubTab = 0 }) {
                Text("CHAT & CALL", modifier = Modifier.padding(8.dp), fontWeight = FontWeight.Bold, fontSize = 11.sp, color = if (selectedSubTab == 0) PrimaryAccent else TextGray)
            }
            Tab(selected = selectedSubTab == 1, onClick = { selectedSubTab = 1 }) {
                Text("CROSS-TEAM", modifier = Modifier.padding(8.dp), fontWeight = FontWeight.Bold, fontSize = 11.sp, color = if (selectedSubTab == 1) PrimaryAccent else TextGray)
            }
            Tab(selected = selectedSubTab == 2, onClick = { selectedSubTab = 2 }) {
                Text("EVENTSYNC AI", modifier = Modifier.padding(8.dp), fontWeight = FontWeight.Bold, fontSize = 11.sp, color = if (selectedSubTab == 2) SecondaryAccent else TextGray)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (selectedSubTab) {
            0 -> ChatSubTab(viewModel = viewModel, currentUser = currentUser, allTeams = allTeams, allUsers = allUsers)
            1 -> CrossTeamSubTab(viewModel = viewModel, currentUser = currentUser, allTeams = allTeams, allRequests = allRequests)
            2 -> EventSyncAiSubTab(currentUser = currentUser, allEvents = allEvents, allTasks = allTasks, allUsers = allUsers, allExpenses = allExpenses)
        }
    }
}

// Sub Tab: Chats & Calls Simulation
@Composable
fun ChatSubTab(
    viewModel: MainScreenViewModel,
    currentUser: UserEntity,
    allTeams: List<TeamEntity>,
    allUsers: List<UserEntity>
) {
    val activeChatRoomId by viewModel.activeChatRoomId.collectAsState()
    val activeChatMessages by viewModel.activeChatMessages.collectAsState()

    var chatMessageText by remember { mutableStateOf("") }

    if (activeChatRoomId == null) {
        // Show list of channels
        Column {
            Text("SQUAD CHANNELS (GROUP HUBLIST)", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(8.dp))
            
            // Show only squads the member belongs to, or all if admin
            val visibleTeams = if (currentUser.role == "admin") allTeams else allTeams.filter { it.id == currentUser.teamId }
            visibleTeams.forEach { team ->
                val teamColor = Color(android.graphics.Color.parseColor(team.color))
                Card(
                    onClick = { viewModel.setChatRoomId("team_${team.id}") },
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    border = BorderStroke(1.dp, teamColor.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(teamColor)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(team.name, color = TextWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("Team Coordination Room", color = TextGray, fontSize = 11.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("DIRECT MESSAGES (DMs)", color = SecondaryAccent, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(8.dp))

            val peerUsers = allUsers.filter { it.id != currentUser.id }
            peerUsers.forEach { peer ->
                val peerTeam = allTeams.find { it.id == peer.teamId }
                val teamColorHex = peerTeam?.color ?: "#95A5A6"
                val teamColor = Color(android.graphics.Color.parseColor(teamColorHex))

                Card(
                    onClick = {
                        val roomId = if (currentUser.id < peer.id) "dm_${currentUser.id}_${peer.id}" else "dm_${peer.id}_${currentUser.id}"
                        viewModel.setChatRoomId(roomId)
                    },
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    border = BorderStroke(1.dp, DividerGray),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(PrimaryBackground)
                                .border(1.dp, teamColor, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(peer.avatar, color = teamColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(peer.name, color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(peerTeam?.name ?: "Club Coordinators", color = TextGray, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    } else {
        // Chat room opened
        val roomId = activeChatRoomId!!
        val roomTitle = if (roomId.startsWith("team_")) {
            val tId = roomId.substringAfter("team_").toInt()
            allTeams.find { it.id == tId }?.name ?: "Squad Room"
        } else {
            val ids = roomId.substringAfter("dm_").split("_").map { it.toInt() }
            val peerId = ids.find { it != currentUser.id } ?: 1
            allUsers.find { it.id == peerId }?.name ?: "Direct Chat"
        }

        Column(modifier = Modifier.fillMaxSize()) {
            // Chat room top header navigation
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { viewModel.setChatRoomId(null) }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = PrimaryAccent)
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(roomTitle, color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }

                // Interactive WebRTC Call initiation shortcuts
                Row {
                    IconButton(onClick = { viewModel.initiateCall(roomId, isVideo = false) }) {
                        Icon(Icons.Default.Call, contentDescription = "Voice Call", tint = PrimaryAccent)
                    }
                    IconButton(onClick = { viewModel.initiateCall(roomId, isVideo = true) }) {
                        Icon(Icons.Default.Videocam, contentDescription = "Video Call", tint = SecondaryAccent)
                    }
                }
            }

            // Message flow
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                reverseLayout = true
            ) {
                // Display latest messages at the bottom
                val sortedMsgs = activeChatMessages.sortedByDescending { it.timestamp }
                items(sortedMsgs) { msg ->
                    val isOwn = msg.senderId == currentUser.id
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isOwn) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Column(
                            horizontalAlignment = if (isOwn) Alignment.End else Alignment.Start,
                            modifier = Modifier.fillMaxWidth(0.85f)
                        ) {
                            if (!isOwn) {
                                Text(msg.senderName, color = PrimaryAccent, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 8.dp))
                            }
                            Box(
                                modifier = Modifier
                                    .background(
                                        color = if (isOwn) PrimaryAccent.copy(alpha = 0.15f) else CardBackground,
                                        shape = RoundedCornerShape(
                                            topStart = 12.dp,
                                            topEnd = 12.dp,
                                            bottomStart = if (isOwn) 12.dp else 0.dp,
                                            bottomEnd = if (isOwn) 0.dp else 12.dp
                                        )
                                    )
                                    .border(
                                        1.dp,
                                        if (isOwn) PrimaryAccent.copy(alpha = 0.5f) else DividerGray,
                                        shape = RoundedCornerShape(
                                            topStart = 12.dp,
                                            topEnd = 12.dp,
                                            bottomStart = if (isOwn) 12.dp else 0.dp,
                                            bottomEnd = if (isOwn) 0.dp else 12.dp
                                        )
                                    )
                                    .padding(12.dp)
                            ) {
                                Text(msg.message, color = TextWhite, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Message composer input panel
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = chatMessageText,
                    onValueChange = { chatMessageText = it },
                    placeholder = { Text("Send encrypted message...", color = TextGray) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryAccent,
                        unfocusedBorderColor = DividerGray,
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite
                    ),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(
                        onSend = {
                            if (chatMessageText.isNotBlank()) {
                                viewModel.sendChatMessage(chatMessageText.trim())
                                chatMessageText = ""
                            }
                        }
                    )
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        if (chatMessageText.isNotBlank()) {
                            viewModel.sendChatMessage(chatMessageText.trim())
                            chatMessageText = ""
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .background(PrimaryAccent, CircleShape)
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.Black)
                }
            }
        }
    }
}

// Sub Tab: Cross-Team Request list & Creation
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrossTeamSubTab(
    viewModel: MainScreenViewModel,
    currentUser: UserEntity,
    allTeams: List<TeamEntity>,
    allRequests: List<CrossTeamRequestEntity>
) {
    var showCreateRequest by remember { mutableStateOf(false) }
    var requestMessage by remember { mutableStateOf("") }
    var targetTeamId by remember { mutableStateOf(1) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("CROSS-TEAM REQUESTS", color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            
            // Members can request assets/reviews
            if (currentUser.role == "member" && currentUser.teamId != null) {
                Button(
                    onClick = { showCreateRequest = true },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Submit Request", tint = Color.Black)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("NEW REQUEST", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (allRequests.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No collaboration requests found.", color = TextGray, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(allRequests) { request ->
                    val fromTeam = allTeams.find { it.id == request.fromTeamId }
                    val toTeam = allTeams.find { it.id == request.toTeamId }
                    val isPending = request.status == "pending"

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, DividerGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${fromTeam?.name ?: "Squad"} ➔ ${toTeam?.name ?: "Squad"}",
                                    color = PrimaryAccent,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Box(
                                    modifier = Modifier
                                        .background(
                                            when (request.status) {
                                                "accepted" -> SuccessGreen.copy(alpha = 0.15f)
                                                "rejected" -> ErrorRed.copy(alpha = 0.15f)
                                                else -> SecondaryAccent.copy(alpha = 0.15f)
                                            },
                                            RoundedCornerShape(4.dp)
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = request.status.uppercase(),
                                        color = when (request.status) {
                                            "accepted" -> SuccessGreen
                                            "rejected" -> ErrorRed
                                            else -> SecondaryAccent
                                        },
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            Text(request.message, color = TextWhite, fontSize = 13.sp)

                            // Acceptance buttons for Target Team members
                            if (isPending && currentUser.teamId == request.toTeamId) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Button(
                                        onClick = { viewModel.updateRequestStatus(request, "rejected") },
                                        colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                                        modifier = Modifier.padding(end = 8.dp)
                                    ) {
                                        Text("DECLINE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Button(
                                        onClick = { viewModel.updateRequestStatus(request, "accepted") },
                                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen)
                                    ) {
                                        Text("ACCEPT", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // CREATE REQUEST DIALOG
        if (showCreateRequest) {
            AlertDialog(
                onDismissRequest = { showCreateRequest = false },
                title = { Text("SUBMIT CROSS-TEAM COLLAB REQUEST", color = PrimaryAccent, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "From: ${allTeams.find { it.id == currentUser.teamId }?.name}",
                            color = TextWhite,
                            fontSize = 14.sp
                        )

                        // Target squad drop
                        var showTargetDrop by remember { mutableStateOf(false) }
                        val otherTeams = allTeams.filter { it.id != currentUser.teamId }
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = allTeams.find { it.id == targetTeamId }?.name ?: "Select Squad",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("To Target Squad", color = TextGray) },
                                trailingIcon = {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Squads", tint = PrimaryAccent)
                                },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Box(
                                modifier = Modifier
                                    .matchParentSize()
                                    .clickable { showTargetDrop = true }
                            )
                            DropdownMenu(
                                expanded = showTargetDrop,
                                onDismissRequest = { showTargetDrop = false },
                                modifier = Modifier.background(CardBackground)
                            ) {
                                otherTeams.forEach { tm ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = tm.name + if (tm.id == targetTeamId) "  ✓" else "",
                                                color = if (tm.id == targetTeamId) PrimaryAccent else TextWhite,
                                                fontWeight = if (tm.id == targetTeamId) FontWeight.Bold else FontWeight.Normal
                                            )
                                        },
                                        onClick = {
                                            targetTeamId = tm.id
                                            showTargetDrop = false
                                        }
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = requestMessage,
                            onValueChange = { requestMessage = it },
                            label = { Text("Collaboration Requirement Details", color = TextGray) },
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = TextWhite, unfocusedTextColor = TextWhite),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (requestMessage.isNotBlank()) {
                                viewModel.submitCrossTeamRequest(targetTeamId, requestMessage.trim())
                                requestMessage = ""
                                showCreateRequest = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
                    ) {
                        Text("SUBMIT REQUEST", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCreateRequest = false }) {
                        Text("CANCEL", color = ErrorRed)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}

// Sub Tab: EventSync AI Chatbot Simulator
@Composable
fun EventSyncAiSubTab(
    currentUser: UserEntity,
    allEvents: List<EventEntity>,
    allTasks: List<TaskEntity>,
    allUsers: List<UserEntity>,
    allExpenses: List<ExpenseEntity>
) {
    var aiMessageInput by remember { mutableStateOf("") }
    val chatHistory = remember {
        mutableStateListOf(
            Pair("assistant", "Greetings, agent ${currentUser.name}. I am EventSync AI (powered by Gemini 3.5 Flash).\n" +
                    "I am connected to your Room Database schema. You can query me on:\n" +
                    "• Summary of upcoming event timelines\n" +
                    "• Spending ledger totals & category audits\n" +
                    "• Task breakdowns & outstanding items\n" +
                    "• Automated workload allocation recommendations")
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            border = BorderStroke(1.dp, SecondaryAccent.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.SmartToy, contentDescription = "AI Bot", tint = SecondaryAccent, modifier = Modifier.size(28.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("EventSync AI Assistant", color = TextWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("ACTIVE ENGINE: Google Gemini 3.5 Flash", color = TextGray, fontSize = 10.sp, letterSpacing = 1.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Chats lists
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            reverseLayout = true
        ) {
            val listToShow = chatHistory.reversed()
            items(listToShow) { (role, message) ->
                val isOwn = role == "user"
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isOwn) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .background(
                                color = if (isOwn) PrimaryAccent.copy(alpha = 0.15f) else CardBackground,
                                shape = RoundedCornerShape(12.dp)
                            )
                            .border(
                                1.dp,
                                if (isOwn) PrimaryAccent.copy(alpha = 0.5f) else SecondaryAccent.copy(alpha = 0.3f),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(12.dp)
                    ) {
                        Text(message, color = TextWhite, fontSize = 13.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Message composer inputs
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = aiMessageInput,
                onValueChange = { aiMessageInput = it },
                placeholder = { Text("Ask EventSync AI...", color = TextGray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = SecondaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.weight(1f),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(
                    onSend = {
                        if (aiMessageInput.isNotBlank()) {
                            val userMsg = aiMessageInput.trim()
                            chatHistory.add(Pair("user", userMsg))
                            aiMessageInput = ""
                            
                            // Process query using local intelligence
                            val aiResponse = generateAiResponse(userMsg, allEvents, allTasks, allUsers, allExpenses)
                            chatHistory.add(Pair("assistant", aiResponse))
                        }
                    }
                )
            )

            Spacer(modifier = Modifier.width(8.dp))

            IconButton(
                onClick = {
                    if (aiMessageInput.isNotBlank()) {
                        val userMsg = aiMessageInput.trim()
                        chatHistory.add(Pair("user", userMsg))
                        aiMessageInput = ""
                        
                        // Process query using local intelligence
                        val aiResponse = generateAiResponse(userMsg, allEvents, allTasks, allUsers, allExpenses)
                        chatHistory.add(Pair("assistant", aiResponse))
                    }
                },
                modifier = Modifier
                    .size(48.dp)
                    .background(SecondaryAccent, CircleShape)
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
            }
        }
    }
}

// Simulated Context-Aware NLP intelligence matching
private fun generateAiResponse(
    query: String,
    events: List<EventEntity>,
    tasks: List<TaskEntity>,
    users: List<UserEntity>,
    expenses: List<ExpenseEntity>
): String {
    val q = query.lowercase()
    return when {
        q.contains("expense") || q.contains("spend") || q.contains("ledger") || q.contains("cost") || q.contains("budget") -> {
            val approved = expenses.filter { it.status == "approved" }
            val pending = expenses.filter { it.status == "pending" }
            val approvedSum = approved.sumOf { it.amount }
            val pendingSum = pending.sumOf { it.amount }

            val approvedBreakdown = approved.groupBy { it.category }
                .map { (cat, list) -> "• $cat: ₹${list.sumOf { it.amount }}" }
                .joinToString("\n")

            "📊 **Financial Ledger Report (Live Database Sync)**\n" +
                    "• Approved spending: ₹${String.format("%,.2f", approvedSum)}\n" +
                    "• Pending approvals: ₹${String.format("%,.2f", pendingSum)}\n\n" +
                    "**Approved Category Breakdown:**\n" +
                    (if (approvedBreakdown.isEmpty()) "• No category spending approved yet." else approvedBreakdown)
        }
        q.contains("task") || q.contains("checklist") || q.contains("outstanding") || q.contains("todo") -> {
            val todo = tasks.filter { it.status == "todo" }
            val inProgress = tasks.filter { it.status == "in_progress" }
            val done = tasks.filter { it.status == "done" }

            val listPending = tasks.filter { it.status != "done" }.take(3).map { t ->
                val assignee = users.find { it.id == t.assignedTo }?.name ?: "Unassigned"
                "• [${t.status.uppercase()}] '${t.title}' assigned to $assignee"
            }.joinToString("\n")

            "📋 **Task Board Summary**\n" +
                    "• Outstanding (Todo): ${todo.size} tasks\n" +
                    "• Work-in-Progress: ${inProgress.size} tasks\n" +
                    "• Completed (Done): ${done.size} tasks\n\n" +
                    "**Latest Outstanding Action Items:**\n" +
                    (if (listPending.isEmpty()) "• Clear grid! No outstanding tasks found." else listPending)
        }
        q.contains("event") || q.contains("timeline") || q.contains("schedule") -> {
            val published = events.filter { it.status == "published" }
            val drafts = events.filter { it.status == "draft" }

            val listEvents = events.map { ev ->
                val dateStr = SimpleDateFormat("MMM dd", Locale.getDefault()).format(Date(ev.date))
                "• ${ev.title} (${ev.status.uppercase()}) - Timeline: $dateStr"
            }.joinToString("\n")

            "📅 **AUISC Events Registry Timeline**\n" +
                    "• Published events: ${published.size}\n" +
                    "• Draft proposals: ${drafts.size}\n\n" +
                    "**Active Schedule:**\n" +
                    (if (listEvents.isEmpty()) "• No events registered in database." else listEvents)
        }
        q.contains("recommend") || q.contains("allocation") || q.contains("assign") || q.contains("busy") -> {
            // Find workloads
            val memberUsers = users.filter { it.role == "member" }
            val workloads = memberUsers.associateWith { member ->
                tasks.filter { it.assignedTo == member.id && it.status != "done" }.size
            }

            val recommendation = workloads.entries.sortedBy { it.value }.map { (member, taskCount) ->
                "• **${member.name}** (Active: $taskCount pending tasks) -> Recommendation: " +
                        (if (taskCount == 0) "Optimal (Free to take complex items)" else if (taskCount <= 2) "Capable (Can absorb light tasks)" else "Saturated (Do not assign)")
            }.joinToString("\n")

            "🤖 **EventSync AI Smart Workload Recommendation**\n" +
                    "I analyzed the active task list across squad developer registries:\n\n" +
                    recommendation + "\n\n" +
                    "*AI Advice: Prioritize task assignments to squad members with 0 pending items to maximize delivery velocity.*"
        }
        else -> {
            "🤖 **EventSync AI (Gemini Engine)**\n" +
                    "I am standing by to process queries. Try asking me:\n" +
                    "• 'How much have we spent so far?'\n" +
                    "• 'Give me a summary of tasks'\n" +
                    "• 'List upcoming events'\n" +
                    "• 'Who has the lightest workload for new tasks?'"
        }
    }
}
