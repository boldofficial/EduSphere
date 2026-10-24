"""
Built-in email templates. Every email the platform sends works out of the box from these; a template
saved in the database with the same slug (Super Admin → Templates) overrides it.

Bodies are content only: the shared layout (header, footer) is added by `wrap_professional_email`.
They are Django templates, so variables are auto-escaped.
"""

P = 'style="font-size:16px;line-height:1.6;margin:0 0 16px;color:#374151"'
SMALL = 'style="font-size:14px;line-height:1.6;margin:16px 0 0;color:#6b7280"'
BUTTON = (
    'style="display:inline-block;padding:12px 28px;background:#1A3A5C;color:#ffffff;'
    'text-decoration:none;border-radius:8px;font-weight:600"'
)
BOX = 'style="background:#f3f6fb;border-radius:8px;padding:16px 20px;margin:20px 0"'


def _button(url_var, label):
    return f'<p style="margin:28px 0"><a href="{{{{ {url_var} }}}}" {BUTTON}>{label}</a></p>'


DEFAULT_TEMPLATES = {
    "welcome_email": {
        "name": "Welcome email (new school)",
        "subject": "Welcome to Registra, {{ school_name }}",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Welcome to Registra</h2>
<p {P}>Hello {{{{ admin_name|default:school_name }}}},</p>
<p {P}>Thank you for registering <strong>{{{{ school_name }}}}</strong>. Your school account is ready.</p>
<div {BOX}>
  <p style="margin:0 0 6px;font-size:14px;color:#6b7280">Your school portal</p>
  <p style="margin:0;font-size:16px"><a href="{{{{ portal_url }}}}">{{{{ portal_url }}}}</a></p>
  <p style="margin:12px 0 0;font-size:14px;color:#6b7280">Sign in with: <strong>{{{{ login_email }}}}</strong></p>
</div>
{_button("login_url", "Sign in to your dashboard")}
<p {P}>Next steps: add your classes and staff, then set up your school website in <strong>Website CMS</strong>.</p>
<p {SMALL}>Need help? Reply to this email or contact our support team.</p>
""",
        "variables": {"school_name": "", "admin_name": "", "portal_url": "", "login_url": "", "login_email": ""},
    },
    "school_approved": {
        "name": "School approved",
        "subject": "{{ school_name }} is now active on Registra",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Your school is active</h2>
<p {P}>Hello {{{{ school_name }}}},</p>
<p {P}>Your school account has been <strong>approved</strong>. You can sign in and start using Registra now.</p>
{_button("login_url", "Go to your dashboard")}
""",
        "variables": {"school_name": "", "login_url": ""},
    },
    "school_rejected": {
        "name": "School registration not approved",
        "subject": "Update on your Registra registration: {{ school_name }}",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Registration update</h2>
<p {P}>Hello {{{{ school_name }}}},</p>
<p {P}>We reviewed your school registration and could not approve it at this time.</p>
<p {P}>Please contact our support team if you would like to discuss it or submit updated details.</p>
""",
        "variables": {"school_name": ""},
    },
    "subscription_expired": {
        "name": "Subscription expired",
        "subject": "Your Registra subscription for {{ school_name }} has expired",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Subscription expired</h2>
<p {P}>Hello {{{{ school_name }}}},</p>
<p {P}>Your Registra subscription has expired, so access to your school dashboard is paused.</p>
<p {P}>Renew your plan to restore access for your staff, students and parents. Your data is safe.</p>
{_button("login_url", "Renew your plan")}
""",
        "variables": {"school_name": "", "login_url": ""},
    },
    "new_school_registration": {
        "name": "New school registered (to super admins)",
        "subject": "New school registered: {{ school_name }}",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">New school registration</h2>
<div {BOX}>
  <p style="margin:0 0 6px"><strong>{{{{ school_name }}}}</strong> ({{{{ domain }}}})</p>
  <p style="margin:0;font-size:14px;color:#374151">Admin: {{{{ admin_email }}}}<br>Phone: {{{{ phone|default:"Not provided" }}}}<br>
  Requested plan: {{{{ requested_plan|default:"Free" }}}}</p>
</div>
{_button("review_url", "Review in Super Admin")}
""",
        "variables": {
            "school_name": "",
            "domain": "",
            "admin_email": "",
            "phone": "",
            "requested_plan": "",
            "review_url": "",
        },
    },
    "platform_announcement": {
        "name": "Platform announcement",
        "subject": "{{ title }}",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">{{{{ title }}}}</h2>
<p {P}>Hello {{{{ name|default:"there" }}}},</p>
<div style="font-size:16px;line-height:1.6;color:#374151;white-space:pre-line">{{{{ message }}}}</div>
<p {SMALL}>This announcement is also shown in your Registra dashboard.</p>
""",
        "variables": {"title": "", "message": "", "name": ""},
    },
    "website_enquiry": {
        "name": "Website contact form message (to the school)",
        "subject": "Website enquiry: {{ subject|default:name }}",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">New message from your website</h2>
<div {BOX}>
  <p style="margin:0;font-size:14px;line-height:1.8;color:#374151">
  <strong>Name:</strong> {{{{ name }}}}<br>
  <strong>Email:</strong> <a href="mailto:{{{{ email }}}}">{{{{ email }}}}</a><br>
  <strong>Phone:</strong> {{{{ phone|default:"Not provided" }}}}<br>
  <strong>Subject:</strong> {{{{ subject|default:"Website enquiry" }}}}</p>
</div>
<div style="font-size:16px;line-height:1.6;color:#374151;white-space:pre-line;border-left:3px solid #e5e7eb;padding-left:14px">{{{{ message }}}}</div>
<p {SMALL}>Reply to this email to answer {{{{ name }}}} directly. You can also see all enquiries in Website CMS → Enquiries.</p>
""",
        "variables": {"name": "", "email": "", "phone": "", "subject": "", "message": "", "school_name": ""},
    },
    "demo-approved": {
        "name": "Demo access approved",
        "subject": "Your Registra demo is ready",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Your demo is ready</h2>
<p {P}>Hello {{{{ name }}}},</p>
<p {P}>Thanks for your interest in Registra for <strong>{{{{ school_name }}}}</strong>. Your demo access is approved.</p>
<div {BOX}>
  <p style="margin:0;font-size:14px;line-height:1.8;color:#374151">
  <strong>Demo address:</strong> <a href="{{{{ login_url }}}}">{{{{ login_url }}}}</a><br>
  <strong>Password:</strong> {{{{ password }}}}</p>
</div>
{_button("login_url", "Open the demo")}
""",
        "variables": {"name": "", "school_name": "", "login_url": "", "password": ""},
    },
    "password_reset": {
        "name": "Password reset link",
        "subject": "Reset your Registra password",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Reset your password</h2>
<p {P}>Hello,</p>
<p {P}>We received a request to reset the password for <strong>{{{{ name }}}}</strong>{{% if is_student %}}
(student account){{% endif %}}. Use the button below to choose a new password. The link works once
and expires in 3 days.</p>
{_button("reset_url", "Choose a new password")}
<p {SMALL}>If you didn't ask for this, you can ignore this email; the password stays the same.</p>
""",
        "variables": {"reset_url": "", "name": "", "is_student": False},
    },
    "test_email": {
        "name": "Test email",
        "subject": "Registra email test",
        "body_html": f"""
<h2 style="margin:0 0 16px;color:#111827">Email is working</h2>
<p {P}>This test was sent from Registra using <strong>{{{{ provider }}}}</strong>.</p>
<p {P}>Welcome emails, approvals, announcements and website enquiries will be delivered the same way.</p>
""",
        "variables": {"provider": ""},
    },
}
