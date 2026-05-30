package com.example.auisceventsync.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.auisceventsync.data.CallEntity
import com.example.auisceventsync.theme.*

@Composable
fun CallOverlay(
    activeCall: CallEntity,
    callerName: String,
    onEndCall: () -> Unit
) {
    var isMuted by remember { mutableStateOf(false) }
    var isVideoOff by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "RadarSweep")
    
    // Animate radar scale and alpha
    val radarScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 2.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "RadarScale"
    )
    val radarAlpha by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "RadarAlpha"
    )

    // Animate scanner sweep line position
    val scanLineY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ScanLine"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryBackground.copy(alpha = 0.95f))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        // Main Container Card
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header Info
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (activeCall.isVideo && !isVideoOff) "ACTIVE WEBRTC SESSION" else "ENCRYPTED AUDIO HUDDLE",
                    color = PrimaryAccent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = callerName,
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Room ID: ${activeCall.roomId}",
                    color = TextGray,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Central Visualizer Viewport
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 32.dp),
                contentAlignment = Alignment.Center
            ) {
                if (activeCall.isVideo && !isVideoOff) {
                    // Video Call Feeds - Split Grid View
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .border(1.dp, PrimaryAccent.copy(alpha = 0.3f), MaterialTheme.shapes.medium)
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        // Feed 1 (User / Local)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .background(CardBackground)
                                .border(1.dp, PrimaryAccent.copy(alpha = 0.6f), MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("You (Local Feed)", color = TextGray, fontSize = 12.sp)
                            
                            // Technical Grid Lines Overlay
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val gridSpacing = 40.dp.toPx()
                                // Vertical lines
                                for (x in 0 until (size.width / gridSpacing).toInt()) {
                                    drawLine(
                                        color = PrimaryAccent.copy(alpha = 0.05f),
                                        start = Offset(x * gridSpacing, 0f),
                                        end = Offset(x * gridSpacing, size.height)
                                    )
                                }
                                // Horizontal lines
                                for (y in 0 until (size.height / gridSpacing).toInt()) {
                                    drawLine(
                                        color = PrimaryAccent.copy(alpha = 0.05f),
                                        start = Offset(0f, y * gridSpacing),
                                        end = Offset(size.width, y * gridSpacing)
                                    )
                                }
                                
                                // Moving Scanner Sweep Line
                                drawLine(
                                    color = PrimaryAccent.copy(alpha = 0.4f),
                                    start = Offset(0f, size.height * scanLineY),
                                    end = Offset(size.width, size.height * scanLineY),
                                    strokeWidth = 3f
                                )
                            }
                        }

                        // Feed 2 (Peer / Remote)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .background(CardBackground)
                                .border(1.dp, SecondaryAccent.copy(alpha = 0.5f), MaterialTheme.shapes.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(callerName, color = TextGray, fontSize = 12.sp)

                            // Technical grid and scanner lines for remote peer
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val gridSpacing = 40.dp.toPx()
                                for (x in 0 until (size.width / gridSpacing).toInt()) {
                                    drawLine(color = SecondaryAccent.copy(alpha = 0.05f), start = Offset(x * gridSpacing, 0f), end = Offset(x * gridSpacing, size.height))
                                }
                                for (y in 0 until (size.height / gridSpacing).toInt()) {
                                    drawLine(color = SecondaryAccent.copy(alpha = 0.05f), start = Offset(0f, y * gridSpacing), end = Offset(size.width, y * gridSpacing))
                                }
                                
                                drawLine(
                                    color = SecondaryAccent.copy(alpha = 0.3f),
                                    start = Offset(0f, size.height * (1f - scanLineY)),
                                    end = Offset(size.width, size.height * (1f - scanLineY)),
                                    strokeWidth = 2f
                                )
                            }
                        }
                    }
                } else {
                    // Voice Call Pulse Animations
                    Box(contentAlignment = Alignment.Center) {
                        // Ambient radar glow circles
                        Canvas(modifier = Modifier.size(240.dp)) {
                            drawCircle(
                                brush = Brush.radialGradient(
                                    colors = listOf(SecondaryAccent.copy(alpha = radarAlpha), Color.Transparent),
                                    center = center,
                                    radius = 120.dp.toPx() * radarScale
                                ),
                                radius = 120.dp.toPx() * radarScale
                            )
                            drawCircle(
                                color = PrimaryAccent.copy(alpha = radarAlpha),
                                radius = 100.dp.toPx() * radarScale,
                                style = Stroke(width = 1.dp.toPx())
                            )
                        }

                        // Static initials avatar
                        Box(
                            modifier = Modifier
                                .size(96.dp)
                                .clip(CircleShape)
                                .background(CardBackground)
                                .border(2.dp, PrimaryAccent, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            val initials = if (callerName.length >= 2) callerName.substring(0, 2).uppercase() else "C"
                            Text(
                                text = initials,
                                color = PrimaryAccent,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Control Actions Panel Bar
            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Mute mic button
                IconButton(
                    onClick = { isMuted = !isMuted },
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = if (isMuted) ErrorRed.copy(alpha = 0.2f) else CardBackground
                    ),
                    modifier = Modifier.size(54.dp).border(1.dp, if (isMuted) ErrorRed else DividerGray, CircleShape)
                ) {
                    Icon(
                        imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = "Mute",
                        tint = if (isMuted) ErrorRed else TextWhite
                    )
                }

                // Hang Up Button
                IconButton(
                    onClick = onEndCall,
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = ErrorRed
                    ),
                    modifier = Modifier.size(68.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = "Hang Up",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Video toggle button
                if (activeCall.isVideo) {
                    IconButton(
                        onClick = { isVideoOff = !isVideoOff },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = if (isVideoOff) ErrorRed.copy(alpha = 0.2f) else CardBackground
                        ),
                        modifier = Modifier.size(54.dp).border(1.dp, if (isVideoOff) ErrorRed else DividerGray, CircleShape)
                    ) {
                        Icon(
                            imageVector = if (isVideoOff) Icons.Default.VideocamOff else Icons.Default.Videocam,
                            contentDescription = "Toggle Video",
                            tint = if (isVideoOff) ErrorRed else TextWhite
                        )
                    }
                }
            }
        }
    }
}
