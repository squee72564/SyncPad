import env from "@/config/index.js";
import logger from "@/config/logger.js";
import type { Workspace, WorkspaceInvite } from "@generated/prisma-postgres/index.js";

type InviteWithInviter = WorkspaceInvite & {
  invitedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export interface WorkspaceInviteEmailPayload {
  invite: InviteWithInviter;
  workspace: Workspace;
  acceptUrl: string;
}

const isEmailSendingEnabled = Boolean(env.RESEND_API_KEY && env.INVITE_EMAIL_FROM);
const RESEND_ENDPOINT = "https://api.resend.com/emails";

const buildInviteHtml = (payload: WorkspaceInviteEmailPayload) => {
  const inviterName =
    payload.invite.invitedBy?.name || payload.invite.invitedBy?.email || "A teammate";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Hi there,</p>
      <p>${inviterName} invited you to join the <strong>${payload.workspace.name}</strong> workspace on SyncPad as a <strong>${payload.invite.role.toLowerCase()}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${payload.acceptUrl}" style="background-color:#1d4ed8;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
          Accept Invite
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px;">${payload.acceptUrl}</p>
      <p>This link will expire soon, so be sure to accept it promptly.</p>
      <p>— The SyncPad Team</p>
    </div>
  `;
};

const buildInviteText = (payload: WorkspaceInviteEmailPayload) => {
  const inviterName =
    payload.invite.invitedBy?.name || payload.invite.invitedBy?.email || "A teammate";

  return [
    "Hi there,",
    "",
    `${inviterName} invited you to join the "${payload.workspace.name}" workspace on SyncPad as a ${payload.invite.role.toLowerCase()}.`,
    "",
    `Accept the invite: ${payload.acceptUrl}`,
    "",
    "This link will expire soon, so be sure to accept it promptly.",
    "",
    "— The SyncPad Team",
  ].join("\n");
};

const sendViaResend = async (options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!env.INVITE_EMAIL_FROM) {
    throw new Error("INVITE_EMAIL_FROM is not configured");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.INVITE_EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Resend API request failed with status ${response.status}: ${errorBody || response.statusText}`
    );
  }
};

const sendWorkspaceInviteEmail = async (payload: WorkspaceInviteEmailPayload) => {
  const subject = `${payload.workspace.name}: You're invited to join on SyncPad`;

  await sendViaResend({
    to: payload.invite.email,
    subject,
    html: buildInviteHtml(payload),
    text: buildInviteText(payload),
  });
};

const queueWorkspaceInviteEmail = (payload: WorkspaceInviteEmailPayload) => {
  if (!isEmailSendingEnabled) {
    logger.info("Workspace invite email sending disabled; share the accept URL manually", {
      inviteId: payload.invite.id,
      email: payload.invite.email,
      acceptUrl: payload.acceptUrl,
    });
    return;
  }

  setImmediate(() => {
    sendWorkspaceInviteEmail(payload).catch((error) => {
      logger.error("Failed to send workspace invite email", {
        error: (error as Error).message,
        inviteId: payload.invite.id,
        email: payload.invite.email,
      });
    });
  });
};

const buildWorkspaceInviteAcceptUrl = (token: string): string => {
  const url = new URL(`/invites/${token}`, env.NEXT_APP_BASE_URL);
  return url.toString();
};

export default {
  queueWorkspaceInviteEmail,
  buildWorkspaceInviteAcceptUrl,
};
