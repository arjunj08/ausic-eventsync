import nodemailer from 'nodemailer';

// Helper to compile general email HTML template in Cosmic Dark theme
const compileEmailTemplate = (subject, titleText, bodyHtml, ctaText = 'Open EventSync', ctaUrl = 'http://localhost:5173') => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            background-color: #0a0a0a;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 191, 255, 0.05);
          }
          .header {
            background-color: #161616;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 1px solid #1f1f1f;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 1px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .logo span {
            color: #00BFFF;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .title {
            font-size: 20px;
            font-weight: 700;
            color: #00BFFF;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .body-text {
            font-size: 14px;
            color: #d1d5db;
            margin-bottom: 30px;
          }
          .cta-container {
            text-align: center;
            margin-bottom: 30px;
          }
          .cta-btn {
            background: linear-gradient(135deg, #00BFFF 0%, #8F5CFF 100%);
            color: #0b0c10 !important;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 15px rgba(0, 191, 255, 0.2);
            transition: opacity 0.2s;
          }
          .footer {
            background-color: #0e0e0e;
            padding: 20px 40px;
            text-align: center;
            font-size: 11px;
            color: #4b5563;
            border-top: 1px solid #1f1f1f;
          }
          .footer a {
            color: #00BFFF;
            text-decoration: none;
          }
          hr {
            border: 0;
            border-top: 1px solid #1f1f1f;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="http://localhost:5173" class="logo">
              <span>⚡ AUISC</span> EventSync
            </a>
          </div>
          <div class="content">
            <h2 class="title">${titleText}</h2>
            <div class="body-text">
              ${bodyHtml}
            </div>
            <div class="cta-container">
              <a href="${ctaUrl}" class="cta-btn" target="_blank">${ctaText}</a>
            </div>
          </div>
          <div class="footer">
            This is an automated notification from AUISC EventSync.<br>
            To configure your alert preferences, visit <a href="http://localhost:5173">Settings</a>.<br>
            <a href="http://localhost:5173">Unsubscribe</a>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Create NodeMailer Transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null; // Return null so we fall back to console logging
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

// Generic Send Mail wrapper
export const sendEmail = async (to, subject, titleText, bodyHtml, ctaText = 'Open EventSync', ctaUrl = 'http://localhost:5173') => {
  const html = compileEmailTemplate(subject, titleText, bodyHtml, ctaText, ctaUrl);
  const from = process.env.EMAIL_FROM || '"AUISC EventSync" <noreply@auisc.edu>';
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n==================================================');
    console.log(`📧 EMAIL MOCK DISPATCH (SMTP Credentials Missing)`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Title:   ${titleText}`);
    console.log(`--------------------------------------------------`);
    // Print a stripped version of the body to console for clarity
    console.log(bodyHtml.replace(/<[^>]*>/g, '').trim());
    console.log(`Action Link: ${ctaUrl}`);
    console.log('==================================================\n');
    return { mock: true, sent: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    // console.log(`Email dispatched successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Nodemailer dispatch error to ${to}:`, error);
    throw error;
  }
};

// 1. Task Assigned Email
export const sendTaskAssignedEmail = async (user, task) => {
  if (user.emailNotifications?.taskAssigned === false) return;

  const subject = `New Task Assigned: ${task.title}`;
  const title = `🎯 New Task Assigned`;
  const body = `
    <p>Hi ${user.name},</p>
    <p>You have been assigned a new task in <strong>AUISC EventSync</strong>.</p>
    <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin-top: 0; color: #ffffff;">${task.title}</h3>
      <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">${task.description}</p>
      ${task.dueDate ? `<p style="font-size: 13px; color: #ef4444; margin-top: 10px; font-weight: 600;">⏰ Due Date: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
    </div>
    <p>Please log in to your board to start working on this task and update its progress status.</p>
  `;

  return sendEmail(user.email, subject, title, body, 'Go to Kanban', 'http://localhost:5173');
};

// 2. Meeting Scheduled Email
export const sendMeetingScheduledEmail = async (user, meeting) => {
  if (user.emailNotifications?.meetingScheduled === false) return;

  const dateStr = new Date(meeting.scheduledAt).toLocaleString();
  const subject = `Meeting Scheduled: ${meeting.title} on ${new Date(meeting.scheduledAt).toLocaleDateString()}`;
  const title = `🗓️ Meeting Scheduled`;
  const body = `
    <p>Hi ${user.name},</p>
    <p>A new club meeting has been scheduled that you are invited to attend.</p>
    <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin-top: 0; color: #ffffff;">${meeting.title}</h3>
      <p style="font-size: 13px; color: #9ca3af; margin-bottom: 10px;">${meeting.description || 'No agenda details provided.'}</p>
      <table style="font-size: 13px; color: #d1d5db; width: 100%;">
        <tr>
          <td style="padding: 2px 0; font-weight: 600; width: 80px;">📅 Date & Time:</td>
          <td style="padding: 2px 0;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0; font-weight: 600;">⏱️ Duration:</td>
          <td style="padding: 2px 0;">${meeting.duration} minutes</td>
        </tr>
        <tr>
          <td style="padding: 2px 0; font-weight: 600;">🔌 Platform:</td>
          <td style="padding: 2px 0; text-transform: uppercase;">${meeting.platform}</td>
        </tr>
      </table>
    </div>
    <p>Use the link below to join the call when it starts.</p>
  `;

  return sendEmail(user.email, subject, title, body, 'Join Meeting', meeting.meetingLink || 'http://localhost:5173');
};

// 3. Meeting 1 Hour Reminder Email
export const sendMeetingReminderEmail = async (user, meeting) => {
  const subject = `⏰ Reminder: ${meeting.title} starts in 1 hour`;
  const title = `⚡ Meeting Reminder`;
  const body = `
    <p>Hi ${user.name},</p>
    <p>This is a quick reminder that the following meeting is scheduled to begin in <strong>1 hour</strong>.</p>
    <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin-top: 0; color: #ffffff;">${meeting.title}</h3>
      <p style="font-size: 13px; color: #9ca3af; margin-bottom: 5px;">📅 Starts: ${new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">🔌 Platform: ${meeting.platform.toUpperCase()}</p>
    </div>
    <p>Click the button below to join the session directly.</p>
  `;

  return sendEmail(user.email, subject, title, body, 'Join Meeting Now', meeting.meetingLink || 'http://localhost:5173');
};

// 4. Expense Update (Approved/Rejected) Email
export const sendExpenseUpdateEmail = async (user, expense, status, adminNote = '') => {
  if (user.emailNotifications?.expenseUpdate === false) return;

  const approved = status === 'approved';
  const subject = `Expense ${approved ? 'Approved ✅' : 'Rejected ❌'}: ${expense.itemDescription}`;
  const title = approved ? `✅ Expense Approved` : `❌ Expense Rejected`;
  const body = `
    <p>Hi ${user.name},</p>
    <p>The financial coordinator has reviewed your expense slip submission.</p>
    <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <table style="font-size: 13px; color: #d1d5db; width: 100%;">
        <tr>
          <td style="padding: 2px 0; font-weight: 600; width: 80px;">Item:</td>
          <td style="padding: 2px 0; color: #ffffff;">${expense.itemDescription}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0; font-weight: 600;">Amount:</td>
          <td style="padding: 2px 0; color: #2ecc71; font-weight: bold;">₹${expense.amount}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0; font-weight: 600;">Status:</td>
          <td style="padding: 2px 0; text-transform: uppercase; font-weight: bold; color: ${approved ? '#2ecc71' : '#e74c3c'}">${status}</td>
        </tr>
      </table>
      ${adminNote ? `<div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 10px; font-size: 12px; color: #9ca3af;"><strong>Note:</strong> ${adminNote}</div>` : ''}
    </div>
  `;

  return sendEmail(user.email, subject, title, body, 'View Expense Dashboard', 'http://localhost:5173');
};

// 5. Weekly Summary Email
export const sendWeeklyDigestEmail = async (user, pendingTasks, upcomingEvents, unreadCount) => {
  if (user.emailNotifications?.weeklyDigest === false) return;

  const subject = `📋 Your Weekly EventSync Summary`;
  const title = `📋 Weekly Digest`;
  
  let tasksHtml = pendingTasks.length === 0 
    ? '<p style="font-size: 13px; color: #6b7280; font-style: italic;">No pending tasks! Excellent work.</p>'
    : '<ul style="font-size: 13px; color: #d1d5db; padding-left: 20px;">' + 
      pendingTasks.map(t => `<li style="margin-bottom: 5px;"><strong>${t.title}</strong> - Status: <em>${t.status}</em></li>`).join('') + 
      '</ul>';

  let eventsHtml = upcomingEvents.length === 0
    ? '<p style="font-size: 13px; color: #6b7280; font-style: italic;">No upcoming events scheduled for this week.</p>'
    : '<ul style="font-size: 13px; color: #d1d5db; padding-left: 20px;">' + 
      upcomingEvents.map(e => `<li style="margin-bottom: 5px;"><strong>${e.title}</strong> on ${new Date(e.date).toLocaleDateString()}</li>`).join('') + 
      '</ul>';

  const body = `
    <p>Hi ${user.name},</p>
    <p>Here is your weekly coordination summary for the Anurag University ISC club workspace.</p>
    
    <h3 style="color: #00BFFF; margin-bottom: 5px; font-size: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;">⚡ Assigned Tasks Pending</h3>
    ${tasksHtml}

    <h3 style="color: #8F5CFF; margin-top: 25px; margin-bottom: 5px; font-size: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;">📅 Upcoming Club Events</h3>
    ${eventsHtml}

    <h3 style="color: #2ECC71; margin-top: 25px; margin-bottom: 5px; font-size: 15px; border-bottom: 1px solid #222; padding-bottom: 5px;">🔔 Notifications Alert</h3>
    <p style="font-size: 13px; color: #d1d5db;">You have <strong>${unreadCount}</strong> unread notifications waiting in your dashboard.</p>
  `;

  return sendEmail(user.email, subject, title, body, 'Open Dashboard', 'http://localhost:5173');
};
