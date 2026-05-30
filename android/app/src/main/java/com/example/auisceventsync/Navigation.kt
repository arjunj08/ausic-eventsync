package com.example.auisceventsync

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.auisceventsync.data.DataRepository
import com.example.auisceventsync.data.EventSyncDatabase
import com.example.auisceventsync.ui.main.MainScreenViewModel
import com.example.auisceventsync.ui.screens.DashboardScreen
import com.example.auisceventsync.ui.screens.LoginScreen
import com.example.auisceventsync.ui.screens.RegisterScreen
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModel

class MainScreenViewModelFactory(private val repository: DataRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainScreenViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MainScreenViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

@Composable
fun MainNavigation() {
    val context = LocalContext.current
    val database = EventSyncDatabase.getDatabase(context)
    val repository = DataRepository(database.eventSyncDao())
    
    val viewModel: MainScreenViewModel = viewModel(
        factory = MainScreenViewModelFactory(repository)
    )

    val backStack = rememberNavBackStack(Login)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<Login> {
                LoginScreen(
                    viewModel = viewModel,
                    onNavigateToRegister = { backStack.add(Register) },
                    onNavigateToDashboard = { backStack.add(Dashboard) }
                )
            }
            entry<Register> {
                RegisterScreen(
                    viewModel = viewModel,
                    onNavigateToLogin = { backStack.removeLastOrNull() }
                )
            }
            entry<Dashboard> {
                DashboardScreen(
                    viewModel = viewModel,
                    onLogout = {
                        viewModel.logout()
                        // Pop all back to Login
                        while (backStack.size > 1) {
                            backStack.removeLastOrNull()
                        }
                    }
                )
            }
        }
    )
}
