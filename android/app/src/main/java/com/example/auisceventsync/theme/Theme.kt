package com.example.auisceventsync.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryAccent,
    secondary = SecondaryAccent,
    tertiary = SuccessGreen,
    background = PrimaryBackground,
    surface = CardBackground,
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onBackground = TextWhite,
    onSurface = TextWhite,
    error = ErrorRed,
    errorContainer = ErrorRed,
    surfaceVariant = CardBackground,
    outline = DividerGray
)

@Composable
fun AUISCEventSyncTheme(
    darkTheme: Boolean = true, // Force Dark Theme only as per specifications
    dynamicColor: Boolean = false, // Force custom palette
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
