package com.example.auisceventsync.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.auisceventsync.theme.*
import com.example.auisceventsync.ui.main.MainScreenViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: MainScreenViewModel,
    onNavigateToRegister: () -> Unit,
    onNavigateToDashboard: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }
    var successMessage by remember { mutableStateOf("") }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryBackground)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // High-tech Neon Banner Logo
            Box(
                modifier = Modifier
                    .border(
                        width = 1.dp,
                        brush = Brush.horizontalGradient(listOf(PrimaryAccent, SecondaryAccent)),
                        shape = RoundedCornerShape(12.dp)
                    )
                    .background(CardBackground)
                    .padding(24.dp)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "ANURAG UNIVERSITY ISC",
                        color = SecondaryAccent,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 3.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "AUISC EventSync",
                        color = PrimaryAccent,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "FUTURISTIC SQUAD SYNC & COORDINATION PORTAL",
                        color = TextGray,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "SIGN IN TO THE GRID",
                color = TextWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Email Input
            OutlinedTextField(
                value = email,
                onValueChange = { email = it; errorMessage = "" },
                label = { Text("Agent Email", color = TextGray) },
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = "Email", tint = PrimaryAccent) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedLabelColor = PrimaryAccent,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password Input
            OutlinedTextField(
                value = password,
                onValueChange = { password = it; errorMessage = "" },
                label = { Text("Access Code (Password)", color = TextGray) },
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Password", tint = PrimaryAccent) },
                visualTransformation = PasswordVisualTransformation(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedLabelColor = PrimaryAccent,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            if (errorMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = errorMessage,
                    color = ErrorRed,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            if (successMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = successMessage,
                    color = SuccessGreen,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Submit Button
            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) {
                        errorMessage = "Credentials cannot be blank"
                        return@Button
                    }
                    viewModel.login(email.trim(), password) { success, msg ->
                        if (success) {
                            successMessage = "Authorized. Access Granted."
                            errorMessage = ""
                            onNavigateToDashboard()
                        } else {
                            errorMessage = msg
                            successMessage = ""
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text("INITIATE SESSION", color = Color.Black, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Demo Credentials Quick Logins Panel
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = BorderStroke(1.dp, DividerGray),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "EVALUATOR QUICK ACCESS (CLICK TO AUTO-LOGIN)",
                        color = SecondaryAccent,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    val demoUsers = listOf(
                        Triple("Arjun (Admin)", "arjun08j@gmail.com", "password123"),
                        Triple("Sanjay (Dev Member)", "sanjay@auisc.com", "password123"),
                        Triple("Nikitha (Design Member)", "nikitha@auisc.com", "password123"),
                        Triple("Rahul (Media Member)", "rahul@auisc.com", "password123")
                    )

                    demoUsers.chunked(2).forEach { row ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            row.forEach { (name, dEmail, dPass) ->
                                OutlinedButton(
                                    onClick = {
                                        email = dEmail
                                        password = dPass
                                        viewModel.login(dEmail, dPass) { success, _ ->
                                            if (success) onNavigateToDashboard()
                                        }
                                    },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryAccent),
                                    border = BorderStroke(1.dp, PrimaryAccent.copy(alpha = 0.5f)),
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(vertical = 4.dp),
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = name,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "New member? Enroll in Registry",
                color = PrimaryAccent,
                fontSize = 14.sp,
                modifier = Modifier
                    .clickable { onNavigateToRegister() }
                    .padding(8.dp)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    viewModel: MainScreenViewModel,
    onNavigateToLogin: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("member") } // admin, member
    var teamId by remember { mutableStateOf<Int?>(2) } // default Dev Force (2)
    var errorMessage by remember { mutableStateOf("") }
    var successMessage by remember { mutableStateOf("") }

    var showRoleDropdown by remember { mutableStateOf(false) }
    var showTeamDropdown by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryBackground)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "AGENT REGISTRY",
                color = PrimaryAccent,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 2.sp
            )
            Text(
                text = "Enroll new squad members into active services",
                color = TextGray,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Name
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; errorMessage = "" },
                label = { Text("Agent Full Name", color = TextGray) },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = "Name", tint = PrimaryAccent) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedLabelColor = PrimaryAccent,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { email = it; errorMessage = "" },
                label = { Text("Grid Email Address", color = TextGray) },
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = "Email", tint = PrimaryAccent) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedLabelColor = PrimaryAccent,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it; errorMessage = "" },
                label = { Text("Access Code (Password)", color = TextGray) },
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Password", tint = PrimaryAccent) },
                visualTransformation = PasswordVisualTransformation(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryAccent,
                    unfocusedBorderColor = DividerGray,
                    focusedLabelColor = PrimaryAccent,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Role Dropdown
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = role.uppercase(),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Grid Level / Role", color = TextGray) },
                    trailingIcon = {
                        Icon(Icons.Default.ArrowDropDown, contentDescription = "Role Dropdown", tint = PrimaryAccent)
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryAccent,
                        unfocusedBorderColor = DividerGray,
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clickable { showRoleDropdown = true }
                )
                DropdownMenu(
                    expanded = showRoleDropdown,
                    onDismissRequest = { showRoleDropdown = false },
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .background(CardBackground)
                ) {
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = "MEMBER (SQUAD DEVELOPER / MEDIA / DESIGN)" + if (role == "member") "  ✓" else "",
                                color = if (role == "member") PrimaryAccent else TextWhite,
                                fontWeight = if (role == "member") FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        onClick = {
                            role = "member"
                            showRoleDropdown = false
                        }
                    )
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = "ADMIN (CLUB COORDINATOR)" + if (role == "admin") "  ✓" else "",
                                color = if (role == "admin") PrimaryAccent else TextWhite,
                                fontWeight = if (role == "admin") FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        onClick = {
                            role = "admin"
                            teamId = null // Admins are cross-squad
                            showRoleDropdown = false
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Team Dropdown (only active if member role is selected)
            if (role == "member") {
                Box(modifier = Modifier.fillMaxWidth()) {
                    val teamName = when (teamId) {
                        1 -> "Design Squad"
                        2 -> "Dev Force"
                        3 -> "Media Team"
                        else -> "Unassigned"
                    }
                    OutlinedTextField(
                        value = teamName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Assigned Squad (Member Only)", color = TextGray) },
                        trailingIcon = {
                            Icon(Icons.Default.ArrowDropDown, contentDescription = "Team Dropdown", tint = PrimaryAccent)
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryAccent,
                            unfocusedBorderColor = DividerGray,
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable { showTeamDropdown = true }
                    )
                    DropdownMenu(
                        expanded = showTeamDropdown,
                        onDismissRequest = { showTeamDropdown = false },
                        modifier = Modifier
                            .fillMaxWidth(0.9f)
                            .background(CardBackground)
                    ) {
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = "Design Squad" + if (teamId == 1) "  ✓" else "",
                                    color = if (teamId == 1) PrimaryAccent else TextWhite,
                                    fontWeight = if (teamId == 1) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            onClick = {
                                teamId = 1
                                showTeamDropdown = false
                            }
                        )
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = "Dev Force" + if (teamId == 2) "  ✓" else "",
                                    color = if (teamId == 2) PrimaryAccent else TextWhite,
                                    fontWeight = if (teamId == 2) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            onClick = {
                                teamId = 2
                                showTeamDropdown = false
                            }
                        )
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = "Media Team" + if (teamId == 3) "  ✓" else "",
                                    color = if (teamId == 3) PrimaryAccent else TextWhite,
                                    fontWeight = if (teamId == 3) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            onClick = {
                                teamId = 3
                                showTeamDropdown = false
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            if (errorMessage.isNotEmpty()) {
                Text(
                    text = errorMessage,
                    color = ErrorRed,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            if (successMessage.isNotEmpty()) {
                Text(
                    text = successMessage,
                    color = SuccessGreen,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            // Register Submit Button
            Button(
                onClick = {
                    if (name.isBlank() || email.isBlank() || password.isBlank()) {
                        errorMessage = "All fields are required"
                        return@Button
                    }
                    viewModel.register(name.trim(), email.trim(), password, role, teamId) { success, msg ->
                        if (success) {
                            successMessage = "Registry Complete. Redirecting to Login."
                            errorMessage = ""
                            onNavigateToLogin()
                        } else {
                            errorMessage = msg
                            successMessage = ""
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text("ENROLL TO DATABASE", color = Color.Black, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Back to Grid Sign-in",
                color = SecondaryAccent,
                fontSize = 14.sp,
                modifier = Modifier
                    .clickable { onNavigateToLogin() }
                    .padding(8.dp)
            )
        }
    }
}
