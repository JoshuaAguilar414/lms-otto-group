# Otto Group Academy LMS
## Password Reset — Step-by-Step Guide

**Audience:** Learners, Coordinators, Administrators, and support staff  
**Product:** Otto Group Academy Learning Management System  
**Live site:** [https://lms-otto-group.onrender.com](https://lms-otto-group.onrender.com)  

---

## Overview

This guide explains how to reset a password in the LMS. There are **two different situations**, depending on account status:

| Situation | Account status | What to use |
|-----------|----------------|-------------|
| **Forgot password** | **Active** — you have signed in before and set a password | Self-service **Forgot password** flow |
| **Never activated** | **Invited** — you received an invitation but have not set a password yet | **Activation link** (or ask an admin to **Resend invite**) |

The LMS does **not** have an admin button to set or override another user’s password directly. Password changes for active accounts are done through the email reset link. For invited users who never activated, administrators resend the **activation** email instead.

---

## Password requirements

Whether you are **activating** for the first time or **resetting** an existing password, the rules are the same:

- At least **10 characters**
- At least one **uppercase** letter (A–Z)
- At least one **lowercase** letter (a–z)
- At least one **number** (0–9)

**Examples of valid passwords:** `Training2026!`, `OttoGroup99`  
**Examples that will fail:** `password` (no uppercase/number), `Short1` (too short)

---

## Part 1 — Reset password (active accounts)

Use this flow if you **previously activated your account**, signed in at least once, and now **forgot your password**.

**Requirements:**

- Your account status must be **Active**
- You must use the **same corporate email** registered in the LMS
- You need access to that email inbox

### Step 1 — Open the sign-in page

1. Go to: [https://lms-otto-group.onrender.com/login](https://lms-otto-group.onrender.com/login)
2. You should see the **Welcome back** sign-in form.

### Step 2 — Start the forgot-password flow

1. Below the **Sign in** button, click **Forgot password?**
2. You will be taken to: [https://lms-otto-group.onrender.com/forgot-password](https://lms-otto-group.onrender.com/forgot-password)

### Step 3 — Enter your corporate email

1. In the **Corporate email** field, enter the email address associated with your LMS account.
2. Click **Send reset link**.
3. Wait for the confirmation message:  
   *“If that email has an active account, a reset link has been sent.”*

> **Note:** For security, the system shows the same message whether or not the email exists. This prevents people from discovering which emails have accounts.

### Step 4 — Check your email

1. Open the inbox for the corporate email you entered.
2. Look for an email with subject:  
   **“Reset your Otto Group Academy password”**
3. If you do not see it within a few minutes, check your **Spam**, **Junk**, or **Quarantine** folder.
4. The reset link is valid for **2 hours** from when you requested it.

### Step 5 — Open the reset link

1. In the email, click **Reset your password** (or copy the full link into your browser).
2. The link opens a page like:  
   `https://lms-otto-group.onrender.com/reset-password?token=...`
3. If the page says **“Missing reset token”**, you opened the page without the link from the email. Go back to the email and use the full link, or request a new one (Step 3).

### Step 6 — Set your new password

1. On the **Reset password** page, enter your **New password**.
2. Enter the same password again in **Confirm password**.
3. Click **Reset password**.
4. When successful, you will see: **“Password updated. You can sign in now.”**

### Step 7 — Sign in with your new password

1. Click **Go to sign in**, or go to: [https://lms-otto-group.onrender.com/login](https://lms-otto-group.onrender.com/login)
2. Enter your **corporate email** and **new password**.
3. Click **Sign in**.
4. You will be redirected to your dashboard (learners) or admin home (coordinators/admins).

---

## Part 2 — First-time password (invited accounts)

If you **never set a password** — for example, you were invited by an administrator but have not completed activation — **do not use Forgot password**. That flow only works for **active** accounts.

Use one of the options below instead.

### Option A — Use your original activation email

1. Find the email with subject:  
   **“Activate your Otto Group training account”**
2. Click **Activate your account**.
3. On the activation page, create and confirm your password (see [Password requirements](#password-requirements)).
4. Click **Activate account**.
5. You will be redirected to sign in.

**Activation link validity:** **7 days** from when the invitation was sent.

### Option B — Self-registration (learners only)

If you were not invited but your organization is on the VECTRA roster:

1. Go to: [https://lms-otto-group.onrender.com/register](https://lms-otto-group.onrender.com/register)
2. Complete registration with your Company ID and stakeholder group.
3. Check email for the activation link and follow Option A, Steps 2–5.

### Option C — Ask an administrator to resend the invitation

If your activation link expired or you cannot find the email, contact your **VECTRA training contact** or an LMS administrator.

**What administrators do:**

1. Sign in to the LMS as **Admin** or **Coordinator**.
2. Go to **Administration** → **Learners and users** (`/admin/users`).
3. Find the user in the list (status will show **Invited**).
4. Click **Resend invite** next to that user.
5. A new activation email is sent to the user’s corporate email.
6. The user follows **Option A** above to set their password.

> **Important:** **Resend invite** only works for users with status **Invited**. It cannot reset a password for someone who is already **Active** — active users must use **Part 1 (Forgot password)**.

---

## Part 3 — Administrator & coordinator reference

### What admins can do

| Action | Available? | How |
|--------|------------|-----|
| Reset another user’s password directly | **No** | Users must use the email reset link |
| Resend activation email | **Yes** | Admin → Users → **Resend invite** (Invited users only) |
| Deactivate / reactivate account | **Yes** | Admin → Users → **Deactivate** / **Activate** |
| Create new invitation | **Yes** | Admin → Users → **Create and invite user** |

### Resend invite — step by step (admin/coordinator)

1. Sign in at [https://lms-otto-group.onrender.com/login](https://lms-otto-group.onrender.com/login)
2. Open **Administration** from the navigation menu.
3. Go to **Learners and users**.
4. Use search or filters to find the user (check **Invited** status filter if needed).
5. In the **Action** column, click **Resend invite**.
6. Confirm the success message: *“Activation email resent to [email].”*
7. Tell the user to check their inbox (and spam folder) for the activation email.

### When to use which flow

| User says… | Likely status | Direct them to… |
|------------|---------------|-----------------|
| “I forgot my password” (signed in before) | Active | **Forgot password** (Part 1) |
| “I never got my invitation” / “Link expired” | Invited | Admin **Resend invite** (Part 2, Option C) |
| “I never registered” | No account | **Register** or admin creates invite |
| “My account is deactivated” | Inactive | Admin **Activate** account, then user signs in or resets password |

---

## Part 4 — Troubleshooting

| Problem | Likely cause | What to do |
|---------|--------------|------------|
| No reset email received | Spam filter, wrong email, or account not Active | Check junk/quarantine; confirm email spelling; if never activated, use activation flow instead |
| “Email provider is not configured” | System email not set up | Contact IT/support — LMS needs Resend, SendGrid, or SMTP configured |
| “This reset link is invalid or has expired” | Link older than **2 hours** or already used | Go to **Forgot password** and request a new link |
| “Missing reset token” | Opened reset page without email link | Use the full link from the email, not `/reset-password` alone |
| “Passwords do not match” | Confirm field differs from new password | Re-enter both fields identically |
| Password rejected | Does not meet complexity rules | Use 10+ chars with upper, lower, and number |
| Forgot password does nothing for invited user | Forgot password only works for **Active** accounts | Use activation email or ask admin to **Resend invite** |
| “Only invited users can receive a new activation email” | User is already Active | User should use **Forgot password** instead |
| Cannot sign in after reset | Typo or old password cached in browser | Try again; clear saved password; use private/incognito window |
| Account locked / deactivated | Status is **Inactive** | Administrator must **Activate** the account first |

---

## Quick reference — URLs

| Page | URL |
|------|-----|
| Sign in | [https://lms-otto-group.onrender.com/login](https://lms-otto-group.onrender.com/login) |
| Forgot password | [https://lms-otto-group.onrender.com/forgot-password](https://lms-otto-group.onrender.com/forgot-password) |
| Reset password (from email link) | [https://lms-otto-group.onrender.com/reset-password?token=...](https://lms-otto-group.onrender.com/reset-password) |
| Activate account (from email link) | [https://lms-otto-group.onrender.com/activate?token=...](https://lms-otto-group.onrender.com/activate) |
| Register (learners) | [https://lms-otto-group.onrender.com/register](https://lms-otto-group.onrender.com/register) |
| Admin — Users | [https://lms-otto-group.onrender.com/admin/users](https://lms-otto-group.onrender.com/admin/users) |

---

## Quick reference — link expiry

| Email type | Subject | Link valid for | Used for |
|------------|---------|----------------|----------|
| Password reset | Reset your Otto Group Academy password | **2 hours** | Active users who forgot password |
| Account activation | Activate your Otto Group training account | **7 days** | New or invited users setting first password |

---

## Flow diagrams

### Active user — forgot password

```
Sign in page → Forgot password?
        ↓
Enter corporate email → Send reset link
        ↓
Open email (within 2 hours)
        ↓
Reset password page → New password + Confirm
        ↓
Sign in with new password
```

### Invited user — first password (not a reset)

```
Receive invitation email
        ↓
Open activation link (within 7 days)
        ↓
Activate page → New password + Confirm
        ↓
Sign in with new password
```

---

## Summary

- **Active users** who forgot their password: use **Forgot password?** on the sign-in page, then follow the email link within **2 hours**.
- **Invited users** who never set a password: use the **activation email**, or ask an admin to **Resend invite** — do not use Forgot password.
- **Administrators** cannot manually set a user’s password; they can resend activation emails for invited users and activate/deactivate accounts.
- All passwords must be at least **10 characters** with **uppercase**, **lowercase**, and a **number**.

---

*For general learner instructions, see `docs/Learner-Guide.md`. For platform capabilities, see `docs/Features-and-Capabilities.md`.*

*Document version: September 2026*
